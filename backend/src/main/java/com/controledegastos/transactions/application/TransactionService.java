package com.controledegastos.transactions.application;

import com.controledegastos.shared.tenancy.TenantContext;
import com.controledegastos.transactions.domain.Transaction;
import com.controledegastos.transactions.domain.TransactionType;
import com.controledegastos.transactions.infrastructure.TransactionRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;

    public TransactionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
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
            UUID categoryId, String description, BigDecimal amount, LocalDate occurredOn,
            TransactionType type, boolean recurring, String notes) {
        var transaction = new Transaction(
                TenantContext.get(), categoryId, description, amount, occurredOn, type, recurring, notes);
        return transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction update(
            UUID id, UUID categoryId, String description, BigDecimal amount, LocalDate occurredOn,
            TransactionType type, boolean recurring, String notes) {
        var transaction = get(id);
        transaction.update(categoryId, description, amount, occurredOn, type, recurring, notes);
        return transaction;
    }

    @Transactional
    public void delete(UUID id) {
        transactionRepository.delete(get(id));
    }
}
