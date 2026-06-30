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
public class SummaryResponse {
    private Department department;
    private Integer month;
    private Integer year;
    private BigDecimal monthlyBudget;
    private BigDecimal totalApprovedExpense;
    private BigDecimal totalPendingExpense;
    private BigDecimal remainingBudget;
    private long pendingCount;
    private long approvedCount;
    private long rejectedCount;
}
