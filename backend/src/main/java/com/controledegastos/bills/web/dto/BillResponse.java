package com.controledegastos.bills.web.dto;

import com.controledegastos.bills.domain.BillStatus;
import com.controledegastos.bills.domain.BillToPay;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record BillResponse(
        UUID id,
        String description,
        BigDecimal amount,
        LocalDate dueDate,
        BillStatus status,
        boolean recurring,
        short reminderDaysBefore,
        boolean overdue) {

    public static BillResponse from(BillToPay bill) {
        return new BillResponse(
                bill.getId(), bill.getDescription(), bill.getAmount(), bill.getDueDate(), bill.getStatus(),
                bill.isRecurring(), bill.getReminderDaysBefore(), bill.isOverdue());
    }
}
