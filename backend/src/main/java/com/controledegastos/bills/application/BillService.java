package com.controledegastos.bills.application;

import com.controledegastos.bills.domain.BillToPay;
import com.controledegastos.bills.infrastructure.BillToPayRepository;
import com.controledegastos.shared.tenancy.TenantContext;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BillService {

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
}
