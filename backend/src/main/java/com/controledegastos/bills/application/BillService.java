package com.controledegastos.bills.application;

import com.controledegastos.bills.BillRecord;
import com.controledegastos.bills.BillsQueryApi;
import com.controledegastos.bills.UpcomingBill;
import com.controledegastos.bills.domain.BillStatus;
import com.controledegastos.bills.domain.BillToPay;
import com.controledegastos.bills.infrastructure.BillToPayRepository;
import com.controledegastos.shared.tenancy.TenantContext;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BillService implements BillsQueryApi {

    private final BillToPayRepository billToPayRepository;

    public BillService(BillToPayRepository billToPayRepository) {
        this.billToPayRepository = billToPayRepository;
    }

    @Transactional(readOnly = true)
    public List<BillToPay> list() {
        return billToPayRepository.findAllByOrderByDueDateAsc();
    }

    @Transactional
    public BillToPay create(String description, BigDecimal amount, LocalDate dueDate, boolean recurring, short reminderDaysBefore) {
        return billToPayRepository.save(
                new BillToPay(TenantContext.get(), description, amount, dueDate, recurring, reminderDaysBefore));
    }

    @Transactional
    public BillToPay markPaid(UUID id) {
        var bill = billToPayRepository.findById(id).orElseThrow(NoSuchElementException::new);
        bill.markPaid();
        return bill;
    }

    @Transactional
    public void delete(UUID id) {
        billToPayRepository.delete(billToPayRepository.findById(id).orElseThrow(NoSuchElementException::new));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UpcomingBill> upcomingWithinDays(int days) {
        var today = LocalDate.now();
        var horizon = today.plusDays(days);
        return billToPayRepository.findAllByOrderByDueDateAsc().stream()
                .filter(bill -> bill.getStatus() == BillStatus.PENDING && !bill.getDueDate().isAfter(horizon))
                .map(bill -> new UpcomingBill(
                        bill.getId(),
                        bill.getDescription(),
                        bill.getAmount(),
                        bill.getDueDate(),
                        ChronoUnit.DAYS.between(today, bill.getDueDate()),
                        bill.isOverdue()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BillRecord> billsDueBetween(LocalDate from, LocalDate to) {
        return billToPayRepository.findAllByOrderByDueDateAsc().stream()
                .filter(bill -> !bill.getDueDate().isBefore(from) && !bill.getDueDate().isAfter(to))
                .map(bill -> new BillRecord(
                        bill.getId(),
                        bill.getDescription(),
                        bill.getAmount(),
                        bill.getDueDate(),
                        bill.getStatus() == BillStatus.PAID ? "PAID" : bill.isOverdue() ? "OVERDUE" : "PENDING"))
                .toList();
    }
}
