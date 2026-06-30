package com.monocept.app.service;

import com.monocept.app.dto.SummaryResponse;
import com.monocept.app.entity.DepartmentBudget;
import com.monocept.app.enums.ClaimStatus;
import com.monocept.app.enums.Department;
import com.monocept.app.repository.DepartmentBudgetRepository;
import com.monocept.app.repository.ExpenseClaimRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SummaryService {

    private final DepartmentBudgetRepository budgetRepository;
    private final ExpenseClaimRepository claimRepository;

    @Transactional(readOnly = true)
    public SummaryResponse getSummary(Department department, Integer month, Integer year) {
        Optional<DepartmentBudget> budgetOpt = budgetRepository.findByDepartmentAndMonthAndYear(department, month, year);
        
        BigDecimal monthlyBudget = budgetOpt.map(DepartmentBudget::getBudgetAmount).orElse(BigDecimal.ZERO);

        BigDecimal approvedTotal = claimRepository.sumByDepartmentStatusMonthYear(department, ClaimStatus.APPROVED, month, year);
        BigDecimal pendingTotal = claimRepository.sumByDepartmentStatusMonthYear(department, ClaimStatus.PENDING, month, year);

        long pendingCount = claimRepository.countByDepartmentStatusMonthYear(department, ClaimStatus.PENDING, month, year);
        long approvedCount = claimRepository.countByDepartmentStatusMonthYear(department, ClaimStatus.APPROVED, month, year);
        long rejectedCount = claimRepository.countByDepartmentStatusMonthYear(department, ClaimStatus.REJECTED, month, year);

        BigDecimal remainingBudget = monthlyBudget.subtract(approvedTotal);

        return SummaryResponse.builder()
            .department(department)
            .month(month)
            .year(year)
            .monthlyBudget(monthlyBudget)
            .totalApprovedExpense(approvedTotal)
            .totalPendingExpense(pendingTotal)
            .remainingBudget(remainingBudget)
            .pendingCount(pendingCount)
            .approvedCount(approvedCount)
            .rejectedCount(rejectedCount)
            .build();
    }
}
