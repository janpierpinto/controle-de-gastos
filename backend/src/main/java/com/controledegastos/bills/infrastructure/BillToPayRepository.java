package com.controledegastos.bills.infrastructure;

import com.controledegastos.bills.domain.BillToPay;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BillToPayRepository extends JpaRepository<BillToPay, UUID> {

    List<BillToPay> findAllByOrderByDueDateAsc();
}
