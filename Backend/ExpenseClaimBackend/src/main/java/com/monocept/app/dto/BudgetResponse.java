package com.monocept.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

import com.monocept.app.enums.Department;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetResponse {
    private Long id;
    private Department department;
    private Integer month;
    private Integer year;
    private BigDecimal budgetAmount;
}
