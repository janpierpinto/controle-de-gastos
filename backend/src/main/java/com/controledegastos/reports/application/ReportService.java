package com.controledegastos.reports.application;

import com.controledegastos.categories.CategoriesQueryApi;
import com.controledegastos.transactions.TransactionSummary;
import com.controledegastos.transactions.TransactionsQueryApi;
import com.lowagie.text.BadElementException;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.ColumnText;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.GradientPaint;
import java.awt.RenderingHints;
import java.awt.geom.GeneralPath;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.springframework.stereotype.Service;

/**
 * Builds a self-contained, JPDigital-branded monthly PDF report (summary,
 * category breakdown, full transaction list) from data other modules
 * already expose — same cross-module query API convention as
 * InsightsService, no new coupling. The brand icon is rasterized at
 * generation time with Java2D (same paths/gradient as JpDigitalLogo.tsx)
 * rather than shipped as a static asset, so there's nothing to keep in sync
 * with the frontend by hand.
 */
@Service
public class ReportService {

    private static final NumberFormat CURRENCY_FORMAT = NumberFormat.getCurrencyInstance(Locale.of("pt", "BR"));
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final Color BRAND_INDIGO = new Color(79, 70, 229);
    private static final Color BRAND_INDIGO_LIGHT = new Color(99, 102, 241);
    private static final Color BRAND_VIOLET = new Color(124, 58, 237);
    private static final Color TEXT_DARK = new Color(15, 23, 42);
    private static final Color TEXT_MUTED = new Color(100, 116, 139);
    private static final Color BORDER_COLOR = new Color(226, 232, 240);
    private static final Color ZEBRA_ROW_COLOR = new Color(248, 250, 252);
    private static final Color POSITIVE_COLOR = new Color(22, 163, 74);
    private static final Color NEGATIVE_COLOR = new Color(220, 38, 38);

    private final TransactionsQueryApi transactionsQueryApi;
    private final CategoriesQueryApi categoriesQueryApi;

    public ReportService(TransactionsQueryApi transactionsQueryApi, CategoriesQueryApi categoriesQueryApi) {
        this.transactionsQueryApi = transactionsQueryApi;
        this.categoriesQueryApi = categoriesQueryApi;
    }

    public byte[] monthlyReport(LocalDate month) {
        var monthStart = month.withDayOfMonth(1);
        var monthEnd = YearMonth.from(monthStart).atEndOfMonth();
        var transactions = transactionsQueryApi.listInPeriod(monthStart, monthEnd).stream()
                .sorted(Comparator.comparing(TransactionSummary::occurredOn))
                .toList();

        var totalIncome = sumByType(transactions, "INCOME");
        var totalExpense = sumByType(transactions, "EXPENSE");
        var balance = totalIncome.subtract(totalExpense);

        var expenseByCategory = new HashMap<UUID, BigDecimal>();
        for (var transaction : transactions) {
            if ("EXPENSE".equals(transaction.type()) && transaction.categoryId() != null) {
                expenseByCategory.merge(transaction.categoryId(), transaction.amount(), BigDecimal::add);
            }
        }
        var categoryRows = expenseByCategory.entrySet().stream()
                .sorted(Map.Entry.<UUID, BigDecimal>comparingByValue().reversed())
                .toList();

        var allCategoryIds = transactions.stream().map(TransactionSummary::categoryId).filter(Objects::nonNull).toList();
        var names = categoriesQueryApi.namesByIds(allCategoryIds);

        try {
            var output = new ByteArrayOutputStream();
            var document = new Document(PageSize.A4, 40, 40, 100, 56);
            var writer = PdfWriter.getInstance(document, output);
            writer.setPageEvent(new BrandedFooter());
            document.open();

            var monthLabel = capitalize(monthStart.getMonth().getDisplayName(TextStyle.FULL, Locale.of("pt", "BR")))
                    + " de " + monthStart.getYear();

            document.add(header(monthLabel));
            document.add(Chunk.NEWLINE);
            document.add(divider());
            document.add(Chunk.NEWLINE);

            document.add(summaryTable(totalIncome, totalExpense, balance));
            document.add(Chunk.NEWLINE);
            document.add(Chunk.NEWLINE);

            document.add(sectionTitle("Gastos por categoria"));
            document.add(categoryTable(categoryRows, names, totalExpense));
            document.add(Chunk.NEWLINE);
            document.add(Chunk.NEWLINE);

            document.add(sectionTitle("Transações do período (" + transactions.size() + ")"));
            document.add(transactionsTable(transactions, names));

            document.close();
            return output.toByteArray();
        } catch (DocumentException e) {
            throw new IllegalStateException("Falha ao gerar relatório PDF", e);
        }
    }

    private PdfPTable header(String monthLabel) throws DocumentException {
        var table = new PdfPTable(new float[] {1, 2});
        table.setWidthPercentage(100);

        var logoCell = new PdfPCell(logoImage());
        logoCell.setBorder(0);
        logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        logoCell.setPadding(0);
        table.addCell(logoCell);

        var brandCell = new PdfPCell();
        brandCell.setBorder(0);
        brandCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        var wordmark = new Paragraph();
        wordmark.add(new Chunk("JP", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, TEXT_DARK)));
        wordmark.add(new Chunk("Digital", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, BRAND_INDIGO)));
        brandCell.addElement(wordmark);
        brandCell.addElement(new Paragraph("Sistema de Controle de Gastos", FontFactory.getFont(FontFactory.HELVETICA, 9, TEXT_MUTED)));
        table.addCell(brandCell);

        var titleCell = new PdfPCell();
        titleCell.setBorder(0);
        titleCell.setColspan(2);
        titleCell.setPaddingTop(14);
        titleCell.addElement(new Paragraph("Relatório financeiro mensal", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, TEXT_DARK)));
        titleCell.addElement(new Paragraph(
                capitalize(monthLabel) + "  ·  Gerado em " + DATE_FORMAT.format(LocalDate.now()),
                FontFactory.getFont(FontFactory.HELVETICA, 10, TEXT_MUTED)));
        table.addCell(titleCell);

        return table;
    }

    private PdfPTable divider() {
        var table = new PdfPTable(1);
        table.setWidthPercentage(100);
        var cell = new PdfPCell();
        cell.setFixedHeight(2f);
        cell.setBackgroundColor(BRAND_INDIGO);
        cell.setBorder(0);
        table.addCell(cell);
        return table;
    }

    private Paragraph sectionTitle(String text) {
        var paragraph = new Paragraph(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, BRAND_INDIGO));
        paragraph.setSpacingAfter(8);
        return paragraph;
    }

    private BigDecimal sumByType(List<TransactionSummary> transactions, String type) {
        return transactions.stream()
                .filter(t -> type.equals(t.type()))
                .map(TransactionSummary::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private PdfPTable summaryTable(BigDecimal income, BigDecimal expense, BigDecimal balance) {
        var table = new PdfPTable(new float[] {1, 0.06f, 1, 0.06f, 1});
        table.setWidthPercentage(100);
        table.addCell(summaryCell("Receitas", income, POSITIVE_COLOR));
        table.addCell(spacerCell());
        table.addCell(summaryCell("Despesas", expense, NEGATIVE_COLOR));
        table.addCell(spacerCell());
        table.addCell(summaryCell("Saldo", balance, balance.signum() >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR));
        return table;
    }

    private PdfPCell spacerCell() {
        var cell = new PdfPCell();
        cell.setBorder(0);
        return cell;
    }

    private PdfPCell summaryCell(String label, BigDecimal value, Color valueColor) {
        var cell = new PdfPCell();
        cell.setPadding(12);
        cell.setBorder(0);
        cell.setBackgroundColor(ZEBRA_ROW_COLOR);
        var labelParagraph = new Paragraph(label, FontFactory.getFont(FontFactory.HELVETICA, 10, TEXT_MUTED));
        labelParagraph.setSpacingAfter(2);
        cell.addElement(labelParagraph);
        cell.addElement(new Paragraph(money(value), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15, valueColor)));
        return cell;
    }

    private PdfPTable categoryTable(List<Map.Entry<UUID, BigDecimal>> rows, Map<UUID, String> names, BigDecimal totalExpense) {
        var table = new PdfPTable(new float[] {3, 1.5f, 1});
        table.setWidthPercentage(100);
        addHeaderCell(table, "Categoria");
        addHeaderCell(table, "Valor");
        addHeaderCell(table, "% do total");

        if (rows.isEmpty()) {
            addEmptyRow(table, 3, "Nenhum gasto categorizado neste período.");
        }
        var rowIndex = 0;
        for (var entry : rows) {
            var name = names.getOrDefault(entry.getKey(), "Sem categoria");
            var pct = totalExpense.signum() == 0
                    ? BigDecimal.ZERO
                    : entry.getValue().multiply(BigDecimal.valueOf(100)).divide(totalExpense, 0, RoundingMode.HALF_UP);
            var zebra = zebraColor(rowIndex++);
            addBodyCell(table, name, TEXT_DARK, zebra);
            addBodyCell(table, money(entry.getValue()), TEXT_DARK, zebra);
            addBodyCell(table, pct + "%", TEXT_MUTED, zebra);
        }
        return table;
    }

    private PdfPTable transactionsTable(List<TransactionSummary> transactions, Map<UUID, String> names) {
        var table = new PdfPTable(new float[] {1.2f, 3, 2, 1, 1.3f});
        table.setWidthPercentage(100);
        addHeaderCell(table, "Data");
        addHeaderCell(table, "Descrição");
        addHeaderCell(table, "Categoria");
        addHeaderCell(table, "Tipo");
        addHeaderCell(table, "Valor");

        if (transactions.isEmpty()) {
            addEmptyRow(table, 5, "Nenhuma transação neste período.");
        }
        var rowIndex = 0;
        for (var transaction : transactions) {
            var isIncome = "INCOME".equals(transaction.type());
            var zebra = zebraColor(rowIndex++);
            addBodyCell(table, DATE_FORMAT.format(transaction.occurredOn()), TEXT_DARK, zebra);
            addBodyCell(table, transaction.description(), TEXT_DARK, zebra);
            addBodyCell(table, transaction.categoryId() != null ? names.getOrDefault(transaction.categoryId(), "—") : "—", TEXT_MUTED, zebra);
            addBodyCell(table, isIncome ? "Receita" : "Gasto", isIncome ? POSITIVE_COLOR : NEGATIVE_COLOR, zebra);
            addBodyCell(table, money(transaction.amount()), isIncome ? POSITIVE_COLOR : NEGATIVE_COLOR, zebra);
        }
        return table;
    }

    private Color zebraColor(int rowIndex) {
        return rowIndex % 2 == 0 ? Color.WHITE : ZEBRA_ROW_COLOR;
    }

    private void addHeaderCell(PdfPTable table, String text) {
        var cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE)));
        cell.setBackgroundColor(BRAND_INDIGO);
        cell.setPadding(7);
        cell.setBorder(0);
        table.addCell(cell);
    }

    private void addBodyCell(PdfPTable table, String text, Color textColor, Color backgroundColor) {
        var cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA, 9, textColor)));
        cell.setPadding(7);
        cell.setBorder(0);
        cell.setBackgroundColor(backgroundColor);
        table.addCell(cell);
    }

    private void addEmptyRow(PdfPTable table, int colspan, String text) {
        var cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA, 9, TEXT_MUTED)));
        cell.setColspan(colspan);
        cell.setPadding(10);
        cell.setBorder(0);
        table.addCell(cell);
    }

    private String money(BigDecimal value) {
        return CURRENCY_FORMAT.format(value);
    }

    private String capitalize(String value) {
        return value.isEmpty() ? value : Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }

    /**
     * Rasterizes the same icon as JpDigitalLogo.tsx (indigo→violet rounded
     * square, white trending-up polyline) at generation time instead of
     * shipping a static asset — keeps the PDF a single self-contained
     * artifact with nothing to go stale against the frontend component.
     */
    private Image logoImage() {
        var size = 240;
        var image = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
        var g = image.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_STROKE_CONTROL, RenderingHints.VALUE_STROKE_PURE);

            var corner = size * 0.28f;
            g.setPaint(new GradientPaint(0, 0, BRAND_INDIGO_LIGHT, size, size, BRAND_VIOLET));
            g.fill(new RoundRectangle2D.Float(0, 0, size, size, corner, corner));

            var scale = 130f / 24f;
            var offset = (size - 130f) / 2f;
            g.setStroke(new BasicStroke(11f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
            g.setColor(Color.WHITE);
            g.draw(iconPath(new float[][] {{23, 6}, {13.5f, 15.5f}, {8.5f, 10.5f}, {1, 18}}, scale, offset));
            g.draw(iconPath(new float[][] {{17, 6}, {23, 6}, {23, 12}}, scale, offset));
        } finally {
            g.dispose();
        }

        try {
            var output = new ByteArrayOutputStream();
            ImageIO.write(image, "png", output);
            var pdfImage = Image.getInstance(output.toByteArray());
            pdfImage.scaleToFit(40, 40);
            return pdfImage;
        } catch (IOException | BadElementException e) {
            throw new IllegalStateException("Falha ao gerar logo do relatório", e);
        }
    }

    private GeneralPath iconPath(float[][] points, float scale, float offset) {
        var path = new GeneralPath();
        path.moveTo(offset + points[0][0] * scale, offset + points[0][1] * scale);
        for (var i = 1; i < points.length; i++) {
            path.lineTo(offset + points[i][0] * scale, offset + points[i][1] * scale);
        }
        return path;
    }

    private static class BrandedFooter extends PdfPageEventHelper {
        private static final Font FOOTER_FONT = FontFactory.getFont(FontFactory.HELVETICA, 8, TEXT_MUTED);

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            var content = writer.getDirectContent();
            ColumnText.showTextAligned(
                    content,
                    Element.ALIGN_LEFT,
                    new Phrase("JPDigital · Sistema de Controle de Gastos", FOOTER_FONT),
                    document.left(),
                    document.bottom() - 24,
                    0);
            ColumnText.showTextAligned(
                    content,
                    Element.ALIGN_RIGHT,
                    new Phrase("Página " + writer.getPageNumber(), FOOTER_FONT),
                    document.right(),
                    document.bottom() - 24,
                    0);
            ColumnText.showTextAligned(
                    content,
                    Element.ALIGN_LEFT,
                    new Phrase("© " + LocalDate.now().getYear() + " JPDigital. Todos os direitos reservados.", FOOTER_FONT),
                    document.left(),
                    document.bottom() - 36,
                    0);
        }
    }
}
