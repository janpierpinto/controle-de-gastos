package com.controledegastos.transactions.infrastructure;

import com.controledegastos.transactions.domain.TransactionSplit;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransactionSplitRepository extends JpaRepository<TransactionSplit, UUID> {

    List<TransactionSplit> findByTransactionId(UUID transactionId);

    void deleteByTransactionId(UUID transactionId);
}
