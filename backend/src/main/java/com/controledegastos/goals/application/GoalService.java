package com.controledegastos.goals.application;

import com.controledegastos.goals.domain.Goal;
import com.controledegastos.goals.infrastructure.GoalRepository;
import com.controledegastos.shared.tenancy.TenantContext;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GoalService {

    private final GoalRepository goalRepository;

    public GoalService(GoalRepository goalRepository) {
        this.goalRepository = goalRepository;
    }

    @Transactional(readOnly = true)
    public List<Goal> list() {
        return goalRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public Goal create(String name, BigDecimal targetAmount, LocalDate targetDate) {
        return goalRepository.save(new Goal(TenantContext.get(), name, targetAmount, targetDate));
    }

    @Transactional
    public Goal update(UUID id, String name, BigDecimal targetAmount, LocalDate targetDate) {
        var goal = get(id);
        goal.update(name, targetAmount, targetDate);
        return goal;
    }

    @Transactional
    public Goal contribute(UUID id, BigDecimal amount) {
        var goal = get(id);
        goal.contribute(amount);
        return goal;
    }

    @Transactional
    public void delete(UUID id) {
        goalRepository.delete(get(id));
    }

    private Goal get(UUID id) {
        return goalRepository.findById(id).orElseThrow(NoSuchElementException::new);
    }
}
