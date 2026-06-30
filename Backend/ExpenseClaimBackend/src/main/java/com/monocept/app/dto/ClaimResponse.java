package com.monocept.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.monocept.app.enums.ClaimStatus;
import com.monocept.app.enums.Department;
import com.monocept.app.enums.ExpenseCategory;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClaimResponse {
    private Long id;
    private String employeeName;
    private Department department;
    private ExpenseCategory category;
    private BigDecimal amount;
    private LocalDate expenseDate;
    private String description;
    private ClaimStatus status;
    private String reviewRemark;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
