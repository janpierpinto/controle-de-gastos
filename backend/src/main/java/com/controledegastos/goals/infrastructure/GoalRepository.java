package com.controledegastos.goals.infrastructure;

import com.controledegastos.goals.domain.Goal;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GoalRepository extends JpaRepository<Goal, UUID> {

    List<Goal> findAllByOrderByCreatedAtDesc();
}
