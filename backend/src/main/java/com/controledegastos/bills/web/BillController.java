package com.controledegastos.bills.web;

import com.controledegastos.bills.application.BillService;
import com.controledegastos.bills.web.dto.BillRequest;
import com.controledegastos.bills.web.dto.BillResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/bills")
public class BillController {

    private final BillService billService;

    public BillController(BillService billService) {
        this.billService = billService;
    }

    @GetMapping
    public List<BillResponse> list() {
        return billService.list().stream().map(BillResponse::from).toList();
    }

    @PostMapping
    public ResponseEntity<BillResponse> create(@Valid @RequestBody BillRequest request) {
        var bill = billService.create(
                request.description(), request.amount(), request.dueDate(), request.recurring(), request.reminderDaysBefore());
        return ResponseEntity.status(HttpStatus.CREATED).body(BillResponse.from(bill));
    }

    @PutMapping("/{id}/pagar")
    public BillResponse markPaid(@PathVariable UUID id) {
        return BillResponse.from(billService.markPaid(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        billService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
