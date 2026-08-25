package com.controledegastos.creditcards.web.dto;

import com.controledegastos.creditcards.application.CardInvoice;
import com.controledegastos.creditcards.domain.CreditCard;
import java.math.BigDecimal;
import java.util.UUID;

public record CreditCardResponse(
        UUID id,
        String name,
        String brand,
        BigDecimal creditLimit,
        short closingDay,
        short dueDay,
        BigDecimal invoiceAmount) {

    public static CreditCardResponse from(CreditCard card) {
        return new CreditCardResponse(
                card.getId(), card.getName(), card.getBrand(), card.getCreditLimit(),
                card.getClosingDay(), card.getDueDay(), null);
    }

    public static CreditCardResponse from(CardInvoice invoice) {
        var card = invoice.card();
        return new CreditCardResponse(
                card.getId(), card.getName(), card.getBrand(), card.getCreditLimit(),
                card.getClosingDay(), card.getDueDay(), invoice.totalAmount());
    }
}
