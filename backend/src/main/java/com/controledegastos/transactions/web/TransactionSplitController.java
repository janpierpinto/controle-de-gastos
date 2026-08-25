package com.controledegastos.transactions.web;

import com.controledegastos.transactions.application.SplitInput;
import com.controledegastos.transactions.application.TransactionService;
import com.controledegastos.transactions.web.dto.SetSplitsRequest;
import com.controledegastos.transactions.web.dto.SplitResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/transactions/{transactionId}/splits")
public class TransactionSplitController {

    private final TransactionService transactionService;

    public TransactionSplitController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    public List<SplitResponse> list(@PathVariable UUID transactionId) {
        return transactionService.listSplits(transactionId).stream().map(SplitResponse::from).toList();
    }

    @PutMapping
    public List<SplitResponse> replace(@PathVariable UUID transactionId, @Valid @RequestBody SetSplitsRequest request) {
        var inputs = request.splits().stream().map(item -> new SplitInput(item.tenantMemberId(), item.amount())).toList();
        return transactionService.setSplits(transactionId, inputs).stream().map(SplitResponse::from).toList();
    }

    @DeleteMapping
    public ResponseEntity<Void> clear(@PathVariable UUID transactionId) {
        transactionService.clearSplits(transactionId);
        return ResponseEntity.noContent().build();
    }
}
