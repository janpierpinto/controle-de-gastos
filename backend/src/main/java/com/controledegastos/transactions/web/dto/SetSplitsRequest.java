package com.controledegastos.transactions.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record SetSplitsRequest(@NotEmpty(message = "obrigatório") @Valid List<SplitItem> splits) {
}
