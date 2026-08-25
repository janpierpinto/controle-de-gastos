package com.controledegastos.goals.web;

import com.controledegastos.goals.application.GoalService;
import com.controledegastos.goals.web.dto.ContributionRequest;
import com.controledegastos.goals.web.dto.GoalRequest;
import com.controledegastos.goals.web.dto.GoalResponse;
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
@RequestMapping("/api/v1/goals")
public class GoalController {

    private final GoalService goalService;

    public GoalController(GoalService goalService) {
        this.goalService = goalService;
    }

    @GetMapping
    public List<GoalResponse> list() {
        return goalService.list().stream().map(GoalResponse::from).toList();
    }

    @PostMapping
    public ResponseEntity<GoalResponse> create(@Valid @RequestBody GoalRequest request) {
        var goal = goalService.create(request.name(), request.targetAmount(), request.targetDate());
        return ResponseEntity.status(HttpStatus.CREATED).body(GoalResponse.from(goal));
    }

    @PutMapping("/{id}")
    public GoalResponse update(@PathVariable UUID id, @Valid @RequestBody GoalRequest request) {
        return GoalResponse.from(goalService.update(id, request.name(), request.targetAmount(), request.targetDate()));
    }

    @PostMapping("/{id}/contributions")
    public GoalResponse contribute(@PathVariable UUID id, @Valid @RequestBody ContributionRequest request) {
        return GoalResponse.from(goalService.contribute(id, request.amount()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        goalService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
