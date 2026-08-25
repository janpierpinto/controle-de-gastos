package com.controledegastos.creditcards.application;

import com.controledegastos.creditcards.domain.CreditCard;
import java.math.BigDecimal;

public record CardInvoice(CreditCard card, BigDecimal totalAmount) {
}
