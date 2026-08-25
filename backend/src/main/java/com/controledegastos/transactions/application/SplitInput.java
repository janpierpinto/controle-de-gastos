package com.controledegastos.transactions.application;

import java.math.BigDecimal;
import java.util.UUID;

public record SplitInput(UUID tenantMemberId, BigDecimal amount) {
}
