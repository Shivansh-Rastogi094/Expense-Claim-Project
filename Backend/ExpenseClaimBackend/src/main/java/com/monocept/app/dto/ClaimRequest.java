package com.monocept.app.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

import com.monocept.app.enums.Department;
import com.monocept.app.enums.ExpenseCategory;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClaimRequest {

    @NotBlank(message = "Employee name is required")
    private String employeeName;

    @NotNull(message = "Department is required")
    private Department department;

    @NotNull(message = "Expense category is required")
    private ExpenseCategory category;

    @NotNull(message = "Expense amount is required")
    @DecimalMin(value = "0.01", message = "Expense amount must be greater than zero")
    private BigDecimal amount;

    @NotNull(message = "Expense date is required")
    @PastOrPresent(message = "Expense date cannot be in the future")
    private LocalDate expenseDate;

    private String description;
}
