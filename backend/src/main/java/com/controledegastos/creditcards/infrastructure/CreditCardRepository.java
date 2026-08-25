package com.controledegastos.creditcards.infrastructure;

import com.controledegastos.creditcards.domain.CreditCard;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CreditCardRepository extends JpaRepository<CreditCard, UUID> {

    List<CreditCard> findAllByOrderByNameAsc();
}
