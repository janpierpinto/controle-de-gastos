package com.controledegastos.creditcards.web;

import com.controledegastos.creditcards.application.CreditCardService;
import com.controledegastos.creditcards.web.dto.CreditCardRequest;
import com.controledegastos.creditcards.web.dto.CreditCardResponse;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/credit-cards")
public class CreditCardController {

    private final CreditCardService creditCardService;

    public CreditCardController(CreditCardService creditCardService) {
        this.creditCardService = creditCardService;
    }

    @GetMapping
    public List<CreditCardResponse> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {
        if (month != null) {
            return creditCardService.listWithInvoiceForMonth(month).stream().map(CreditCardResponse::from).toList();
        }
        return creditCardService.list().stream().map(CreditCardResponse::from).toList();
    }

    @PostMapping
    public ResponseEntity<CreditCardResponse> create(@Valid @RequestBody CreditCardRequest request) {
        var card = creditCardService.create(
                request.name(), request.brand(), request.creditLimit(), request.closingDay(), request.dueDay());
        return ResponseEntity.status(HttpStatus.CREATED).body(CreditCardResponse.from(card));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        creditCardService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
