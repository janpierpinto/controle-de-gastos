package com.controledegastos.transactions.infrastructure;

import com.controledegastos.transactions.domain.Transaction;
import com.controledegastos.transactions.domain.TransactionType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * No explicit tenant_id filter anywhere here — RLS (see
 * V3__categories_and_transactions.sql) already restricts every query to the
 * current tenant, so a plain findAll()/findById() can never leak another
 * tenant's rows.
 */
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    Page<Transaction> findAllByOrderByOccurredOnDescCreatedAtDesc(Pageable pageable);

    Page<Transaction> findByOccurredOnBetweenOrderByOccurredOnDescCreatedAtDesc(
            LocalDate from, LocalDate to, Pageable pageable);

    @Query("""
            select coalesce(sum(t.amount), 0) from Transaction t
            where t.categoryId = :categoryId and t.type = :type
            and t.occurredOn >= :from and t.occurredOn <= :to
            """)
    BigDecimal sumAmountByCategoryAndTypeAndPeriod(UUID categoryId, TransactionType type, LocalDate from, LocalDate to);

    @Query("""
            select coalesce(sum(t.amount), 0) from Transaction t
            where t.creditCardId = :creditCardId and t.type = :type
            and t.occurredOn >= :from and t.occurredOn <= :to
            """)
    BigDecimal sumAmountByCreditCardAndTypeAndPeriod(UUID creditCardId, TransactionType type, LocalDate from, LocalDate to);
}
