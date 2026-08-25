package com.controledegastos.creditcards.application;

import com.controledegastos.creditcards.domain.CreditCard;
import com.controledegastos.creditcards.infrastructure.CreditCardRepository;
import com.controledegastos.shared.tenancy.TenantContext;
import com.controledegastos.transactions.TransactionsQueryApi;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Fase 1 (manual) simplifica a fatura para o mês calendário da transação —
 * ver comentário em V6__credit_cards.sql. Nada aqui é persistido como
 * "fatura", é sempre calculado na leitura, no mesmo espírito de
 * BudgetService.
 */
@Service
public class CreditCardService {

    private final CreditCardRepository creditCardRepository;
    private final TransactionsQueryApi transactionsQueryApi;

    public CreditCardService(CreditCardRepository creditCardRepository, TransactionsQueryApi transactionsQueryApi) {
        this.creditCardRepository = creditCardRepository;
        this.transactionsQueryApi = transactionsQueryApi;
    }

    @Transactional(readOnly = true)
    public List<CreditCard> list() {
        return creditCardRepository.findAllByOrderByNameAsc();
    }

    @Transactional(readOnly = true)
    public List<CardInvoice> listWithInvoiceForMonth(LocalDate month) {
        var monthStart = month.withDayOfMonth(1);
        var monthEnd = YearMonth.from(monthStart).atEndOfMonth();
        return creditCardRepository.findAllByOrderByNameAsc().stream()
                .map(card -> new CardInvoice(
                        card, transactionsQueryApi.totalExpensesForCreditCardInPeriod(card.getId(), monthStart, monthEnd)))
                .toList();
    }

    @Transactional
    public CreditCard create(String name, String brand, BigDecimal creditLimit, short closingDay, short dueDay) {
        return creditCardRepository.save(new CreditCard(TenantContext.get(), name, brand, creditLimit, closingDay, dueDay));
    }

    @Transactional
    public void delete(UUID id) {
        creditCardRepository.delete(creditCardRepository.findById(id).orElseThrow(NoSuchElementException::new));
    }
}
