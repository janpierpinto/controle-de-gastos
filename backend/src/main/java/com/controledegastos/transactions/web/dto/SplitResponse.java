package com.controledegastos.transactions.web.dto;

import com.controledegastos.transactions.domain.TransactionSplit;
import java.math.BigDecimal;
import java.util.UUID;

public record SplitResponse(UUID id, UUID tenantMemberId, BigDecimal amount) {

    public static SplitResponse from(TransactionSplit split) {
        return new SplitResponse(split.getId(), split.getTenantMemberId(), split.getAmount());
    }
}
