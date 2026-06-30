package com.monocept.app.service;

import com.monocept.app.dto.ClaimRequest;
import com.monocept.app.dto.ClaimResponse;
import com.monocept.app.dto.ReviewRequest;
import com.monocept.app.entity.*;
import com.monocept.app.enums.ClaimStatus;
import com.monocept.app.enums.Department;
import com.monocept.app.enums.ExpenseCategory;
import com.monocept.app.exception.BudgetConflictException;
import com.monocept.app.exception.InvalidClaimStateException;
import com.monocept.app.exception.ResourceNotFoundException;
import com.monocept.app.repository.DepartmentBudgetRepository;
import com.monocept.app.repository.ExpenseClaimRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClaimService {

    private final ExpenseClaimRepository claimRepository;
    private final DepartmentBudgetRepository budgetRepository;

    @Transactional
    public ClaimResponse submitClaim(ClaimRequest req) {
        ExpenseClaim claim = ExpenseClaim.builder()
            .employeeName(req.getEmployeeName())
            .department(req.getDepartment())
            .category(req.getCategory())
            .amount(req.getAmount())
            .expenseDate(req.getExpenseDate())
            .description(req.getDescription())
            .status(ClaimStatus.PENDING)
            .build();

        ExpenseClaim saved = claimRepository.save(claim);
        return mapToResponse(saved);
    }

    @Transactional
    public ClaimResponse approveClaim(Long id, ReviewRequest req) {
        ExpenseClaim claim = claimRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Expense claim not found with ID: " + id));

        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw new InvalidClaimStateException("Only pending claims can be approved.");
        }

        int month = claim.getExpenseDate().getMonthValue();
        int year = claim.getExpenseDate().getYear();

        DepartmentBudget budget = budgetRepository.findByDepartmentAndMonthAndYear(claim.getDepartment(), month, year)
            .orElseThrow(() -> new BudgetConflictException("No budget defined for department " + claim.getDepartment() + " in " + month + "/" + year));

        BigDecimal approvedTotal = claimRepository.sumByDepartmentStatusMonthYear(
            claim.getDepartment(), ClaimStatus.APPROVED, month, year);

        if (approvedTotal.add(claim.getAmount()).compareTo(budget.getBudgetAmount()) > 0) {
            BigDecimal available = budget.getBudgetAmount().subtract(approvedTotal);
            throw new BudgetConflictException(
                "Approving this claim would exceed the department's monthly budget. " +
                "Budget: " + budget.getBudgetAmount() + ", Already Approved: " + approvedTotal + 
                ", Claim Amount: " + claim.getAmount() + ", Available: " + available
            );
        }

        claim.setStatus(ClaimStatus.APPROVED);
        if (req != null && req.getReviewRemark() != null) {
            claim.setReviewRemark(req.getReviewRemark());
        }
        
        ExpenseClaim updated = claimRepository.save(claim);
        return mapToResponse(updated);
    }

    @Transactional
    public ClaimResponse rejectClaim(Long id, ReviewRequest req) {
        ExpenseClaim claim = claimRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Expense claim not found with ID: " + id));

        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw new InvalidClaimStateException("Only pending claims can be rejected.");
        }

        if (req == null || req.getReviewRemark() == null || req.getReviewRemark().trim().isEmpty()) {
            throw new InvalidClaimStateException("Review remark is required for rejection.");
        }

        claim.setStatus(ClaimStatus.REJECTED);
        claim.setReviewRemark(req.getReviewRemark());

        ExpenseClaim updated = claimRepository.save(claim);
        return mapToResponse(updated);
    }

    @Transactional(readOnly = true)
    public List<ClaimResponse> searchClaims(Department department, Integer month, Integer year, ClaimStatus status, ExpenseCategory category) {
        return claimRepository.search(department, status, category, month, year)
            .stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ClaimResponse getById(Long id) {
        ExpenseClaim claim = claimRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Expense claim not found with ID: " + id));
        return mapToResponse(claim);
    }

    private ClaimResponse mapToResponse(ExpenseClaim claim) {
        return ClaimResponse.builder()
            .id(claim.getId())
            .employeeName(claim.getEmployeeName())
            .department(claim.getDepartment())
            .category(claim.getCategory())
            .amount(claim.getAmount())
            .expenseDate(claim.getExpenseDate())
            .description(claim.getDescription())
            .status(claim.getStatus())
            .reviewRemark(claim.getReviewRemark())
            .createdAt(claim.getCreatedAt())
            .updatedAt(claim.getUpdatedAt())
            .build();
    }
}
