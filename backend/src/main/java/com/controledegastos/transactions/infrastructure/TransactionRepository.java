package com.controledegastos.transactions.infrastructure;

import com.controledegastos.transactions.domain.Transaction;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
