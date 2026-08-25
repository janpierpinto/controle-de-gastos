package com.controledegastos.goals.web.dto;

import com.controledegastos.goals.domain.Goal;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.UUID;

public record GoalResponse(
        UUID id,
        String name,
        BigDecimal targetAmount,
        BigDecimal currentAmount,
        LocalDate targetDate,
        int percentageComplete,
        boolean completed) {

    public static GoalResponse from(Goal goal) {
        var percentageComplete = goal.getTargetAmount().signum() == 0
                ? 0
                : Math.min(
                        100,
                        goal.getCurrentAmount()
                                .multiply(BigDecimal.valueOf(100))
                                .divide(goal.getTargetAmount(), 0, RoundingMode.HALF_UP)
                                .intValue());

        return new GoalResponse(
                goal.getId(),
                goal.getName(),
                goal.getTargetAmount(),
                goal.getCurrentAmount(),
                goal.getTargetDate(),
                percentageComplete,
                goal.getCurrentAmount().compareTo(goal.getTargetAmount()) >= 0);
    }
}
