package com.controledegastos.budgets.web;

import com.controledegastos.budgets.application.BudgetService;
import com.controledegastos.budgets.web.dto.BudgetRequest;
import com.controledegastos.budgets.web.dto.BudgetResponse;
import com.controledegastos.budgets.web.dto.UpdateBudgetRequest;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/budgets")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @GetMapping
    public List<BudgetResponse> list(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {
        return budgetService.list(month).stream().map(BudgetResponse::from).toList();
    }

    @PostMapping
    public ResponseEntity<BudgetResponse> create(@Valid @RequestBody BudgetRequest request) {
        var progress = budgetService.create(
                request.categoryId(), request.monthReference(), request.plannedAmount(), request.alertThresholdPct());
        return ResponseEntity.status(HttpStatus.CREATED).body(BudgetResponse.from(progress));
    }

    @PutMapping("/{id}")
    public BudgetResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateBudgetRequest request) {
        return BudgetResponse.from(budgetService.update(id, request.plannedAmount(), request.alertThresholdPct()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        budgetService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
