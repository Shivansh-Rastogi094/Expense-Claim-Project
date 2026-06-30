package com.monocept.app.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BudgetUpdateRequest {

    @NotNull(message = "Budget amount is required")
    @DecimalMin(value = "0.01", message = "Budget amount must be greater than zero")
    private BigDecimal budgetAmount;
}
