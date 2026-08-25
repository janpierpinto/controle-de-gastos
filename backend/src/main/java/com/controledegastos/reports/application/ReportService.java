package com.controledegastos.reports.application;

import com.controledegastos.categories.CategoriesQueryApi;
import com.controledegastos.transactions.TransactionSummary;
import com.controledegastos.transactions.TransactionsQueryApi;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
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
import org.springframework.stereotype.Service;

/**
 * Builds a self-contained monthly PDF report (summary, category breakdown,
 * full transaction list) from data other modules already expose — same
 * cross-module query API convention as InsightsService, no new coupling.
 */
@Service
public class ReportService {

    private static final NumberFormat CURRENCY_FORMAT = NumberFormat.getCurrencyInstance(Locale.of("pt", "BR"));
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final Color BRAND_COLOR = new Color(79, 70, 229);
    private static final Color BORDER_COLOR = new Color(226, 232, 240);
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
            var document = new Document(PageSize.A4, 40, 40, 50, 40);
            PdfWriter.getInstance(document, output);
            document.open();

            var monthLabel = capitalize(monthStart.getMonth().getDisplayName(TextStyle.FULL, Locale.of("pt", "BR")))
                    + " de " + monthStart.getYear();
            document.add(new Paragraph("Relatório financeiro — " + monthLabel, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18)));
            document.add(new Paragraph(
                    "Gerado em " + DATE_FORMAT.format(LocalDate.now()), FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY)));
            document.add(Chunk.NEWLINE);

            document.add(summaryTable(totalIncome, totalExpense, balance));
            document.add(Chunk.NEWLINE);

            document.add(new Paragraph("Gastos por categoria", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13)));
            document.add(Chunk.NEWLINE);
            document.add(categoryTable(categoryRows, names, totalExpense));
            document.add(Chunk.NEWLINE);

            document.add(new Paragraph(
                    "Transações do período (" + transactions.size() + ")", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13)));
            document.add(Chunk.NEWLINE);
            document.add(transactionsTable(transactions, names));

            document.close();
            return output.toByteArray();
        } catch (DocumentException e) {
            throw new IllegalStateException("Falha ao gerar relatório PDF", e);
        }
    }

    private BigDecimal sumByType(List<TransactionSummary> transactions, String type) {
        return transactions.stream()
                .filter(t -> type.equals(t.type()))
                .map(TransactionSummary::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private PdfPTable summaryTable(BigDecimal income, BigDecimal expense, BigDecimal balance) {
        var table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.addCell(summaryCell("Receitas", income, POSITIVE_COLOR));
        table.addCell(summaryCell("Despesas", expense, NEGATIVE_COLOR));
        table.addCell(summaryCell("Saldo", balance, balance.signum() >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR));
        return table;
    }

    private PdfPCell summaryCell(String label, BigDecimal value, Color valueColor) {
        var cell = new PdfPCell();
        cell.setPadding(10);
        cell.setBorderColor(BORDER_COLOR);
        cell.addElement(new Paragraph(label, FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY)));
        cell.addElement(new Paragraph(money(value), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, valueColor)));
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
        for (var entry : rows) {
            var name = names.getOrDefault(entry.getKey(), "Sem categoria");
            var pct = totalExpense.signum() == 0
                    ? BigDecimal.ZERO
                    : entry.getValue().multiply(BigDecimal.valueOf(100)).divide(totalExpense, 0, RoundingMode.HALF_UP);
            addBodyCell(table, name);
            addBodyCell(table, money(entry.getValue()));
            addBodyCell(table, pct + "%");
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
        for (var transaction : transactions) {
            addBodyCell(table, DATE_FORMAT.format(transaction.occurredOn()));
            addBodyCell(table, transaction.description());
            addBodyCell(table, transaction.categoryId() != null ? names.getOrDefault(transaction.categoryId(), "—") : "—");
            addBodyCell(table, "EXPENSE".equals(transaction.type()) ? "Gasto" : "Receita");
            addBodyCell(table, money(transaction.amount()));
        }
        return table;
    }

    private void addHeaderCell(PdfPTable table, String text) {
        var cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE)));
        cell.setBackgroundColor(BRAND_COLOR);
        cell.setPadding(6);
        table.addCell(cell);
    }

    private void addBodyCell(PdfPTable table, String text) {
        var cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA, 9, Color.DARK_GRAY)));
        cell.setPadding(6);
        cell.setBorderColor(BORDER_COLOR);
        table.addCell(cell);
    }

    private void addEmptyRow(PdfPTable table, int colspan, String text) {
        var cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA, 9, Color.GRAY)));
        cell.setColspan(colspan);
        cell.setPadding(8);
        cell.setBorderColor(BORDER_COLOR);
        table.addCell(cell);
    }

    private String money(BigDecimal value) {
        return CURRENCY_FORMAT.format(value);
    }

    private String capitalize(String value) {
        return value.isEmpty() ? value : Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }
}
