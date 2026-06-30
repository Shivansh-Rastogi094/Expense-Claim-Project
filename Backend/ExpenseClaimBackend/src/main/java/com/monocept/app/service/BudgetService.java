package com.monocept.app.service;

import com.monocept.app.dto.BudgetRequest;
import com.monocept.app.dto.BudgetResponse;
import com.monocept.app.dto.BudgetUpdateRequest;
import com.monocept.app.entity.DepartmentBudget;
import com.monocept.app.enums.ClaimStatus;
import com.monocept.app.enums.Department;
import com.monocept.app.exception.BudgetConflictException;
import com.monocept.app.exception.ResourceNotFoundException;
import com.monocept.app.repository.DepartmentBudgetRepository;
import com.monocept.app.repository.ExpenseClaimRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final DepartmentBudgetRepository budgetRepository;
    private final ExpenseClaimRepository claimRepository;

    @Transactional
    public BudgetResponse createBudget(BudgetRequest req) {
        Optional<DepartmentBudget> existing = budgetRepository.findByDepartmentAndMonthAndYear(
            req.getDepartment(), req.getMonth(), req.getYear());
        
        if (existing.isPresent()) {
            throw new BudgetConflictException(
                "A budget already exists for department " + req.getDepartment() + " in " + req.getMonth() + "/" + req.getYear()
            );
        }

        DepartmentBudget budget = DepartmentBudget.builder()
            .department(req.getDepartment())
            .month(req.getMonth())
            .year(req.getYear())
            .budgetAmount(req.getBudgetAmount())
            .build();

        DepartmentBudget saved = budgetRepository.save(budget);
        return mapToResponse(saved);
    }

    @Transactional
    public BudgetResponse updateBudget(Long id, BudgetUpdateRequest req) {
        DepartmentBudget budget = budgetRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Department budget not found with ID: " + id));

        // We only allow updating the budgetAmount. Department, Month, and Year are immutable on update.
        BigDecimal approvedTotal = claimRepository.sumByDepartmentStatusMonthYear(
            budget.getDepartment(), ClaimStatus.APPROVED, budget.getMonth(), budget.getYear());

        if (req.getBudgetAmount().compareTo(approvedTotal) < 0) {
            throw new BudgetConflictException(
                "Cannot reduce budget amount below the sum of already-approved claims for this period. " +
                "Approved Claims Total: " + approvedTotal + ", Proposed Budget: " + req.getBudgetAmount()
            );
        }

        budget.setBudgetAmount(req.getBudgetAmount());
        DepartmentBudget updated = budgetRepository.save(budget);
        return mapToResponse(updated);
    }

    @Transactional(readOnly = true)
    public List<BudgetResponse> getAllBudgets(Department department, Integer year) {
        List<DepartmentBudget> budgets;
        if (department != null && year != null) {
            budgets = budgetRepository.findByDepartmentAndYear(department, year);
        } else {
            budgets = budgetRepository.findAll();
        }
        return budgets.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BudgetResponse getBudgetById(Long id) {
        DepartmentBudget budget = budgetRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Department budget not found with ID: " + id));
        return mapToResponse(budget);
    }

    @Transactional(readOnly = true)
    public BudgetResponse lookupBudget(Department department, Integer month, Integer year) {
        DepartmentBudget budget = budgetRepository.findByDepartmentAndMonthAndYear(department, month, year)
            .orElseThrow(() -> new ResourceNotFoundException("No budget defined for department " + department + " in " + month + "/" + year));
        return mapToResponse(budget);
    }

    private BudgetResponse mapToResponse(DepartmentBudget budget) {
        return BudgetResponse.builder()
            .id(budget.getId())
            .department(budget.getDepartment())
            .month(budget.getMonth())
            .year(budget.getYear())
            .budgetAmount(budget.getBudgetAmount())
            .build();
    }
}
