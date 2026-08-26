package com.controledegastos.reports.application;

import com.controledegastos.bills.BillRecord;
import com.controledegastos.bills.BillsQueryApi;
import com.controledegastos.budgets.BudgetAlert;
import com.controledegastos.budgets.BudgetsQueryApi;
import com.controledegastos.categories.CategoriesQueryApi;
import com.controledegastos.identity.TenantQueryApi;
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
import java.util.TreeMap;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.springframework.stereotype.Service;

/**
 * Builds self-contained, JPDigital-branded PDF reports (monthly and annual)
 * from data other modules already expose — same cross-module query API
 * convention as InsightsService, no new coupling. The brand icon is
 * rasterized at generation time with Java2D (same paths/gradient as
 * JpDigitalLogo.tsx) rather than shipped as a static asset, so there's
 * nothing to keep in sync with the frontend by hand.
 */
@Service
public class ReportService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /**
     * ReportService is a singleton bean shared across concurrent requests, so
     * the tenant's currency (resolved once per report, in render()) can't be
     * a plain instance field — same reasoning as TenantContext/UserContext
     * elsewhere in this codebase, reused here for the same kind of
     * per-request-not-per-instance state.
     */
    private static final ThreadLocal<NumberFormat> CURRENT_MONEY_FORMAT = new ThreadLocal<>();

    private static final Color BRAND_INDIGO = new Color(79, 70, 229);
    private static final Color BRAND_INDIGO_LIGHT = new Color(99, 102, 241);
    private static final Color BRAND_VIOLET = new Color(124, 58, 237);
    private static final Color TEXT_DARK = new Color(15, 23, 42);
    private static final Color TEXT_MUTED = new Color(100, 116, 139);
    private static final Color ZEBRA_ROW_COLOR = new Color(248, 250, 252);
    private static final Color POSITIVE_COLOR = new Color(22, 163, 74);
    private static final Color NEGATIVE_COLOR = new Color(220, 38, 38);
    private static final Color WARNING_COLOR = new Color(217, 119, 6);

    private final TransactionsQueryApi transactionsQueryApi;
    private final CategoriesQueryApi categoriesQueryApi;
    private final BudgetsQueryApi budgetsQueryApi;
    private final BillsQueryApi billsQueryApi;
    private final TenantQueryApi tenantQueryApi;

    public ReportService(
            TransactionsQueryApi transactionsQueryApi,
            CategoriesQueryApi categoriesQueryApi,
            BudgetsQueryApi budgetsQueryApi,
            BillsQueryApi billsQueryApi,
            TenantQueryApi tenantQueryApi) {
        this.transactionsQueryApi = transactionsQueryApi;
        this.categoriesQueryApi = categoriesQueryApi;
        this.budgetsQueryApi = budgetsQueryApi;
        this.billsQueryApi = billsQueryApi;
        this.tenantQueryApi = tenantQueryApi;
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

        var expenseByCategory = totalsByCategory(transactions, "EXPENSE");
        var incomeByCategory = totalsByCategory(transactions, "INCOME");
        var expenseRows = sortedDesc(expenseByCategory);
        var incomeRows = sortedDesc(incomeByCategory);

        var allCategoryIds = transactions.stream().map(TransactionSummary::categoryId).filter(Objects::nonNull).toList();
        var names = categoriesQueryApi.namesByIds(allCategoryIds);

        var previousMonthStart = monthStart.minusMonths(1);
        var previousMonthEnd = YearMonth.from(previousMonthStart).atEndOfMonth();
        var previousTransactions = transactionsQueryApi.listInPeriod(previousMonthStart, previousMonthEnd);
        var previousIncome = sumByType(previousTransactions, "INCOME");
        var previousExpense = sumByType(previousTransactions, "EXPENSE");

        var budgetAlerts = budgetsQueryApi.alertsForMonth(monthStart);
        var budgetNames = categoriesQueryApi.namesByIds(budgetAlerts.stream().map(BudgetAlert::categoryId).toList());

        var bills = billsQueryApi.billsDueBetween(monthStart, monthEnd);

        var monthLabel = capitalize(monthStart.getMonth().getDisplayName(TextStyle.FULL, Locale.of("pt", "BR")))
                + " de " + monthStart.getYear();

        return render("Relatório financeiro mensal", monthLabel, document -> {
            document.add(summaryTable(totalIncome, totalExpense, balance));
            document.add(Chunk.NEWLINE);
            document.add(Chunk.NEWLINE);

            document.add(sectionTitle("Resumo rápido"));
            document.add(quickStatsTable(transactions));
            document.add(Chunk.NEWLINE);
            document.add(Chunk.NEWLINE);

            document.add(sectionTitle("Comparação com o mês anterior"));
            document.add(comparisonTable(totalIncome, previousIncome, totalExpense, previousExpense));
            document.add(Chunk.NEWLINE);
            document.add(Chunk.NEWLINE);

            if (!budgetAlerts.isEmpty()) {
                document.add(sectionTitle("Orçamentos do mês"));
                document.add(budgetsTable(budgetAlerts, budgetNames));
                document.add(Chunk.NEWLINE);
                document.add(Chunk.NEWLINE);
            }

            if (!incomeRows.isEmpty()) {
                document.add(sectionTitle("Receitas por categoria"));
                document.add(categoryTable(incomeRows, names, totalIncome));
                document.add(Chunk.NEWLINE);
                document.add(Chunk.NEWLINE);
            }

            document.add(sectionTitle("Gastos por categoria"));
            document.add(categoryTable(expenseRows, names, totalExpense));
            document.add(Chunk.NEWLINE);
            document.add(Chunk.NEWLINE);

            if (!bills.isEmpty()) {
                document.add(sectionTitle("Contas do período"));
                document.add(billsTable(bills));
                document.add(Chunk.NEWLINE);
                document.add(Chunk.NEWLINE);
            }

            document.add(sectionTitle("Transações do período (" + transactions.size() + ")"));
            document.add(transactionsTable(transactions, names));
        });
    }

    public byte[] annualReport(int year) {
        var yearStart = LocalDate.of(year, 1, 1);
        var yearEnd = LocalDate.of(year, 12, 31);
        var transactions = transactionsQueryApi.listInPeriod(yearStart, yearEnd);

        var monthlyTotals = new TreeMap<YearMonth, MonthTotals>();
        for (var m = 1; m <= 12; m++) {
            var month = YearMonth.of(year, m);
            monthlyTotals.put(month, new MonthTotals(month, BigDecimal.ZERO, BigDecimal.ZERO));
        }
        for (var transaction : transactions) {
            var month = YearMonth.from(transaction.occurredOn());
            var current = monthlyTotals.get(month);
            if (current == null) {
                continue;
            }
            if ("INCOME".equals(transaction.type())) {
                monthlyTotals.put(month, new MonthTotals(month, current.income().add(transaction.amount()), current.expense()));
            } else if ("EXPENSE".equals(transaction.type())) {
                monthlyTotals.put(month, new MonthTotals(month, current.income(), current.expense().add(transaction.amount())));
            }
        }

        var totalIncome = monthlyTotals.values().stream().map(MonthTotals::income).reduce(BigDecimal.ZERO, BigDecimal::add);
        var totalExpense = monthlyTotals.values().stream().map(MonthTotals::expense).reduce(BigDecimal.ZERO, BigDecimal::add);
        var balance = totalIncome.subtract(totalExpense);

        var expenseByCategory = totalsByCategory(transactions, "EXPENSE");
        var expenseRows = sortedDesc(expenseByCategory);
        var names = categoriesQueryApi.namesByIds(expenseByCategory.keySet());

        var best = monthlyTotals.values().stream().max(Comparator.comparing(MonthTotals::balance));
        var worst = monthlyTotals.values().stream().min(Comparator.comparing(MonthTotals::balance));

        return render("Relatório financeiro anual", "Ano de " + year, document -> {
            document.add(summaryTable(totalIncome, totalExpense, balance));
            document.add(Chunk.NEWLINE);
            document.add(Chunk.NEWLINE);

            document.add(sectionTitle("Melhor e pior mês"));
            document.add(bestWorstMonthTable(best, worst));
            document.add(Chunk.NEWLINE);
            document.add(Chunk.NEWLINE);

            document.add(sectionTitle("Resumo por mês"));
            document.add(monthlyBreakdownTable(monthlyTotals.values(), totalIncome, totalExpense, balance));
            document.add(Chunk.NEWLINE);
            document.add(Chunk.NEWLINE);

            document.add(sectionTitle("Gastos por categoria no ano"));
            document.add(categoryTable(expenseRows, names, totalExpense));
        });
    }

    private interface DocumentBody {
        void write(Document document) throws DocumentException;
    }

    private byte[] render(String title, String subtitle, DocumentBody body) {
        CURRENT_MONEY_FORMAT.set(currencyFormat(tenantQueryApi.currentTenantCurrency()));
        try {
            var output = new ByteArrayOutputStream();
            var document = new Document(PageSize.A4, 40, 40, 100, 56);
            var writer = PdfWriter.getInstance(document, output);
            writer.setPageEvent(new BrandedFooter());
            document.open();

            document.add(header(title, subtitle));
            document.add(Chunk.NEWLINE);
            document.add(divider());
            document.add(Chunk.NEWLINE);

            body.write(document);

            document.close();
            return output.toByteArray();
        } catch (DocumentException e) {
            throw new IllegalStateException("Falha ao gerar relatório PDF", e);
        } finally {
            CURRENT_MONEY_FORMAT.remove();
        }
    }

    private NumberFormat currencyFormat(String currencyCode) {
        var locale = switch (currencyCode) {
            case "USD" -> Locale.of("en", "US");
            case "EUR" -> Locale.of("de", "DE");
            case "GBP" -> Locale.of("en", "GB");
            default -> Locale.of("pt", "BR");
        };
        return NumberFormat.getCurrencyInstance(locale);
    }

    private PdfPTable header(String title, String subtitle) throws DocumentException {
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
        titleCell.addElement(new Paragraph(title, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, TEXT_DARK)));
        titleCell.addElement(new Paragraph(
                subtitle + "  ·  Gerado em " + DATE_FORMAT.format(LocalDate.now()), FontFactory.getFont(FontFactory.HELVETICA, 10, TEXT_MUTED)));
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

    private Map<UUID, BigDecimal> totalsByCategory(List<TransactionSummary> transactions, String type) {
        var totals = new HashMap<UUID, BigDecimal>();
        for (var transaction : transactions) {
            if (type.equals(transaction.type()) && transaction.categoryId() != null) {
                totals.merge(transaction.categoryId(), transaction.amount(), BigDecimal::add);
            }
        }
        return totals;
    }

    private List<Map.Entry<UUID, BigDecimal>> sortedDesc(Map<UUID, BigDecimal> totals) {
        return totals.entrySet().stream().sorted(Map.Entry.<UUID, BigDecimal>comparingByValue().reversed()).toList();
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

    private PdfPTable quickStatsTable(List<TransactionSummary> transactions) {
        var expenses = transactions.stream().filter(t -> "EXPENSE".equals(t.type())).toList();
        var averageExpense = expenses.isEmpty()
                ? BigDecimal.ZERO
                : expenses.stream().map(TransactionSummary::amount).reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(expenses.size()), 2, RoundingMode.HALF_UP);
        var biggestExpense = expenses.stream().max(Comparator.comparing(TransactionSummary::amount));
        var mostFrequentCategoryId = expenses.stream()
                .filter(t -> t.categoryId() != null)
                .collect(java.util.stream.Collectors.groupingBy(TransactionSummary::categoryId, java.util.stream.Collectors.counting()))
                .entrySet()
                .stream()
                .max(Map.Entry.comparingByValue());
        var mostFrequentName = mostFrequentCategoryId
                .map(entry -> categoriesQueryApi.namesByIds(List.of(entry.getKey())).getOrDefault(entry.getKey(), "—"))
                .orElse("—");

        var table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.addCell(statCell("Transações", String.valueOf(transactions.size())));
        table.addCell(statCell("Ticket médio (gastos)", money(averageExpense)));
        table.addCell(statCell("Maior gasto", biggestExpense.map(t -> money(t.amount())).orElse("—")));
        table.addCell(statCell("Categoria mais frequente", mostFrequentName));
        return table;
    }

    private PdfPCell statCell(String label, String value) {
        var cell = new PdfPCell();
        cell.setPadding(10);
        cell.setBorder(0);
        var labelParagraph = new Paragraph(label, FontFactory.getFont(FontFactory.HELVETICA, 8, TEXT_MUTED));
        labelParagraph.setSpacingAfter(3);
        cell.addElement(labelParagraph);
        cell.addElement(new Paragraph(value, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, TEXT_DARK)));
        return cell;
    }

    private PdfPTable comparisonTable(BigDecimal income, BigDecimal previousIncome, BigDecimal expense, BigDecimal previousExpense) {
        var table = new PdfPTable(new float[] {2, 1.3f, 1.3f, 1.2f});
        table.setWidthPercentage(100);
        addHeaderCell(table, "Métrica");
        addHeaderCell(table, "Este mês");
        addHeaderCell(table, "Mês anterior");
        addHeaderCell(table, "Variação");

        addComparisonRow(table, "Receitas", income, previousIncome, 0);
        addComparisonRow(table, "Despesas", expense, previousExpense, 1);
        return table;
    }

    private void addComparisonRow(PdfPTable table, String label, BigDecimal current, BigDecimal previous, int rowIndex) {
        var zebra = zebraColor(rowIndex);
        addBodyCell(table, label, TEXT_DARK, zebra);
        addBodyCell(table, money(current), TEXT_DARK, zebra);
        addBodyCell(table, money(previous), TEXT_MUTED, zebra);

        String variationText;
        Color variationColor;
        if (previous.signum() == 0) {
            variationText = current.signum() == 0 ? "—" : "novo";
            variationColor = TEXT_MUTED;
        } else {
            var changePct = current.subtract(previous).multiply(BigDecimal.valueOf(100)).divide(previous, 0, RoundingMode.HALF_UP);
            variationText = (changePct.signum() > 0 ? "+" : "") + changePct + "%";
            variationColor = changePct.signum() > 0 ? NEGATIVE_COLOR : changePct.signum() < 0 ? POSITIVE_COLOR : TEXT_MUTED;
        }
        addBodyCell(table, variationText, variationColor, zebra);
    }

    private PdfPTable budgetsTable(List<BudgetAlert> alerts, Map<UUID, String> names) {
        var table = new PdfPTable(new float[] {2.2f, 1.2f, 1.2f, 1, 1.3f});
        table.setWidthPercentage(100);
        addHeaderCell(table, "Categoria");
        addHeaderCell(table, "Planejado");
        addHeaderCell(table, "Gasto");
        addHeaderCell(table, "% usado");
        addHeaderCell(table, "Status");

        var rowIndex = 0;
        for (var alert : alerts) {
            var zebra = zebraColor(rowIndex++);
            var statusText = alert.exceeded() ? "Estourado" : alert.alertTriggered() ? "Atenção" : "Dentro do limite";
            var statusColor = alert.exceeded() ? NEGATIVE_COLOR : alert.alertTriggered() ? WARNING_COLOR : POSITIVE_COLOR;
            addBodyCell(table, names.getOrDefault(alert.categoryId(), "categoria"), TEXT_DARK, zebra);
            addBodyCell(table, money(alert.plannedAmount()), TEXT_DARK, zebra);
            addBodyCell(table, money(alert.spentAmount()), TEXT_DARK, zebra);
            addBodyCell(table, alert.percentageUsed() + "%", TEXT_MUTED, zebra);
            addBodyCell(table, statusText, statusColor, zebra);
        }
        return table;
    }

    private PdfPTable billsTable(List<BillRecord> bills) {
        var table = new PdfPTable(new float[] {1.2f, 3, 1.3f, 1.3f});
        table.setWidthPercentage(100);
        addHeaderCell(table, "Vencimento");
        addHeaderCell(table, "Descrição");
        addHeaderCell(table, "Valor");
        addHeaderCell(table, "Status");

        var rowIndex = 0;
        for (var bill : bills) {
            var zebra = zebraColor(rowIndex++);
            var statusText = switch (bill.status()) {
                case "PAID" -> "Paga";
                case "OVERDUE" -> "Atrasada";
                default -> "Pendente";
            };
            var statusColor = switch (bill.status()) {
                case "PAID" -> POSITIVE_COLOR;
                case "OVERDUE" -> NEGATIVE_COLOR;
                default -> WARNING_COLOR;
            };
            addBodyCell(table, DATE_FORMAT.format(bill.dueDate()), TEXT_DARK, zebra);
            addBodyCell(table, bill.description(), TEXT_DARK, zebra);
            addBodyCell(table, money(bill.amount()), TEXT_DARK, zebra);
            addBodyCell(table, statusText, statusColor, zebra);
        }
        return table;
    }

    private PdfPTable bestWorstMonthTable(java.util.Optional<MonthTotals> best, java.util.Optional<MonthTotals> worst) {
        var table = new PdfPTable(new float[] {1, 0.06f, 1});
        table.setWidthPercentage(100);
        table.addCell(monthHighlightCell("Melhor mês", best, POSITIVE_COLOR));
        table.addCell(spacerCell());
        table.addCell(monthHighlightCell("Pior mês", worst, NEGATIVE_COLOR));
        return table;
    }

    private PdfPCell monthHighlightCell(String label, java.util.Optional<MonthTotals> monthTotals, Color valueColor) {
        var cell = new PdfPCell();
        cell.setPadding(12);
        cell.setBorder(0);
        cell.setBackgroundColor(ZEBRA_ROW_COLOR);
        var labelParagraph = new Paragraph(label, FontFactory.getFont(FontFactory.HELVETICA, 10, TEXT_MUTED));
        labelParagraph.setSpacingAfter(2);
        cell.addElement(labelParagraph);
        if (monthTotals.isEmpty()) {
            cell.addElement(new Paragraph("—", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, TEXT_MUTED)));
            return cell;
        }
        var value = monthTotals.get();
        var monthName = capitalize(value.month().getMonth().getDisplayName(TextStyle.FULL, Locale.of("pt", "BR")));
        cell.addElement(new Paragraph(monthName, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, TEXT_DARK)));
        cell.addElement(new Paragraph("Saldo: " + money(value.balance()), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, valueColor)));
        return cell;
    }

    private PdfPTable monthlyBreakdownTable(java.util.Collection<MonthTotals> months, BigDecimal totalIncome, BigDecimal totalExpense, BigDecimal totalBalance) {
        var table = new PdfPTable(new float[] {1.6f, 1.2f, 1.2f, 1.2f});
        table.setWidthPercentage(100);
        addHeaderCell(table, "Mês");
        addHeaderCell(table, "Receitas");
        addHeaderCell(table, "Despesas");
        addHeaderCell(table, "Saldo");

        var rowIndex = 0;
        for (var monthTotals : months) {
            var zebra = zebraColor(rowIndex++);
            var monthName = capitalize(monthTotals.month().getMonth().getDisplayName(TextStyle.FULL, Locale.of("pt", "BR")));
            var balance = monthTotals.balance();
            addBodyCell(table, monthName, TEXT_DARK, zebra);
            addBodyCell(table, money(monthTotals.income()), POSITIVE_COLOR, zebra);
            addBodyCell(table, money(monthTotals.expense()), NEGATIVE_COLOR, zebra);
            addBodyCell(table, money(balance), balance.signum() >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR, zebra);
        }

        var totalCell1 = totalCell("Total do ano");
        table.addCell(totalCell1);
        table.addCell(totalCell(money(totalIncome)));
        table.addCell(totalCell(money(totalExpense)));
        table.addCell(totalCell(money(totalBalance)));
        return table;
    }

    private PdfPCell totalCell(String text) {
        var cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, TEXT_DARK)));
        cell.setPadding(8);
        cell.setBorder(0);
        cell.setBackgroundColor(ZEBRA_ROW_COLOR);
        return cell;
    }

    private PdfPTable categoryTable(List<Map.Entry<UUID, BigDecimal>> rows, Map<UUID, String> names, BigDecimal total) {
        var table = new PdfPTable(new float[] {3, 1.5f, 1});
        table.setWidthPercentage(100);
        addHeaderCell(table, "Categoria");
        addHeaderCell(table, "Valor");
        addHeaderCell(table, "% do total");

        if (rows.isEmpty()) {
            addEmptyRow(table, 3, "Nenhum lançamento categorizado neste período.");
        }
        var rowIndex = 0;
        for (var entry : rows) {
            var name = names.getOrDefault(entry.getKey(), "Sem categoria");
            var pct = total.signum() == 0
                    ? BigDecimal.ZERO
                    : entry.getValue().multiply(BigDecimal.valueOf(100)).divide(total, 0, RoundingMode.HALF_UP);
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
        return CURRENT_MONEY_FORMAT.get().format(value);
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

    private record MonthTotals(YearMonth month, BigDecimal income, BigDecimal expense) {
        BigDecimal balance() {
            return income.subtract(expense);
        }
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
