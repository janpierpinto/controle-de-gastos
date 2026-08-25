package com.controledegastos.transactions.application;

import com.controledegastos.shared.tenancy.TenantContext;
import com.controledegastos.transactions.TransactionSummary;
import com.controledegastos.transactions.TransactionsQueryApi;
import com.controledegastos.transactions.domain.Transaction;
import com.controledegastos.transactions.domain.TransactionSplit;
import com.controledegastos.transactions.domain.TransactionType;
import com.controledegastos.transactions.infrastructure.TransactionRepository;
import com.controledegastos.transactions.infrastructure.TransactionSplitRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TransactionService implements TransactionsQueryApi {

    private final TransactionRepository transactionRepository;
    private final TransactionSplitRepository transactionSplitRepository;

    public TransactionService(TransactionRepository transactionRepository, TransactionSplitRepository transactionSplitRepository) {
        this.transactionRepository = transactionRepository;
        this.transactionSplitRepository = transactionSplitRepository;
    }

    @Transactional(readOnly = true)
    public Page<Transaction> list(LocalDate from, LocalDate to, Pageable pageable) {
        if (from != null && to != null) {
            return transactionRepository.findByOccurredOnBetweenOrderByOccurredOnDescCreatedAtDesc(from, to, pageable);
        }
        return transactionRepository.findAllByOrderByOccurredOnDescCreatedAtDesc(pageable);
    }

    @Transactional(readOnly = true)
    public Transaction get(UUID id) {
        return transactionRepository.findById(id).orElseThrow(NoSuchElementException::new);
    }

    @Transactional
    public Transaction create(
            UUID categoryId, UUID creditCardId, String description, BigDecimal amount, LocalDate occurredOn,
            TransactionType type, boolean recurring, String notes) {
        var transaction = new Transaction(
                TenantContext.get(), categoryId, creditCardId, description, amount, occurredOn, type, recurring, notes);
        return transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction update(
            UUID id, UUID categoryId, UUID creditCardId, String description, BigDecimal amount, LocalDate occurredOn,
            TransactionType type, boolean recurring, String notes) {
        var transaction = get(id);
        transaction.update(categoryId, creditCardId, description, amount, occurredOn, type, recurring, notes);
        return transaction;
    }

    @Transactional
    public void delete(UUID id) {
        transactionRepository.delete(get(id));
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal totalExpensesForCategoryInPeriod(UUID categoryId, LocalDate from, LocalDate to) {
        return transactionRepository.sumAmountByCategoryAndTypeAndPeriod(categoryId, TransactionType.EXPENSE, from, to);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal totalExpensesForCreditCardInPeriod(UUID creditCardId, LocalDate from, LocalDate to) {
        return transactionRepository.sumAmountByCreditCardAndTypeAndPeriod(creditCardId, TransactionType.EXPENSE, from, to);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionSummary> listInPeriod(LocalDate from, LocalDate to) {
        return transactionRepository.findByOccurredOnBetweenOrderByOccurredOnDescCreatedAtDesc(from, to, Pageable.unpaged())
                .stream()
                .map(t -> new TransactionSummary(t.getId(), t.getCategoryId(), t.getDescription(), t.getAmount(), t.getOccurredOn(), t.getType().name()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TransactionSplit> listSplits(UUID transactionId) {
        get(transactionId);
        return transactionSplitRepository.findByTransactionId(transactionId);
    }

    @Transactional
    public List<TransactionSplit> setSplits(UUID transactionId, List<SplitInput> inputs) {
        var transaction = get(transactionId);
        var total = inputs.stream().map(SplitInput::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (total.compareTo(transaction.getAmount()) != 0) {
            throw new IllegalArgumentException("A soma das divisões deve ser igual ao valor da transação");
        }
        transactionSplitRepository.deleteByTransactionId(transactionId);
        var tenantId = TenantContext.get();
        return inputs.stream()
                .map(input -> transactionSplitRepository.save(
                        new TransactionSplit(tenantId, transactionId, input.tenantMemberId(), input.amount())))
                .toList();
    }

    @Transactional
    public void clearSplits(UUID transactionId) {
        get(transactionId);
        transactionSplitRepository.deleteByTransactionId(transactionId);
    }
}
