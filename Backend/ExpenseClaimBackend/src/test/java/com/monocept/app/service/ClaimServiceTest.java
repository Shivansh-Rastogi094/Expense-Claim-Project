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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ClaimServiceTest {

    @Mock
    private ExpenseClaimRepository claimRepository;

    @Mock
    private DepartmentBudgetRepository budgetRepository;

    @InjectMocks
    private ClaimService claimService;

    private ExpenseClaim pendingClaim;
    private DepartmentBudget budget;

    @BeforeEach
    void setUp() {
        pendingClaim = ExpenseClaim.builder()
            .id(1L)
            .employeeName("John Doe")
            .department(Department.ENGINEERING)
            .category(ExpenseCategory.TRAVEL)
            .amount(new BigDecimal("200.00"))
            .expenseDate(LocalDate.of(2026, 6, 15))
            .status(ClaimStatus.PENDING)
            .build();

        budget = DepartmentBudget.builder()
            .id(1L)
            .department(Department.ENGINEERING)
            .month(6)
            .year(2026)
            .budgetAmount(new BigDecimal("1000.00"))
            .build();
    }

    @Test
    void testSubmitClaim_Success() {
        ClaimRequest req = new ClaimRequest("John Doe", Department.ENGINEERING, ExpenseCategory.TRAVEL, new BigDecimal("200.00"), LocalDate.of(2026, 6, 15), "Client visit");
        
        when(claimRepository.save(any(ExpenseClaim.class))).thenAnswer(invocation -> {
            ExpenseClaim c = invocation.getArgument(0);
            c.setId(1L);
            return c;
        });

        ClaimResponse res = claimService.submitClaim(req);

        assertNotNull(res);
        assertEquals(1L, res.getId());
        assertEquals("John Doe", res.getEmployeeName());
        assertEquals(Department.ENGINEERING, res.getDepartment());
        assertEquals(ClaimStatus.PENDING, res.getStatus());
        verify(claimRepository, times(1)).save(any(ExpenseClaim.class));
    }

    @Test
    void testApproveClaim_Success() {
        ReviewRequest reviewReq = new ReviewRequest("Looks good");
        
        when(claimRepository.findById(1L)).thenReturn(Optional.of(pendingClaim));
        when(budgetRepository.findByDepartmentAndMonthAndYear(Department.ENGINEERING, 6, 2026))
            .thenReturn(Optional.of(budget));
        when(claimRepository.sumByDepartmentStatusMonthYear(Department.ENGINEERING, ClaimStatus.APPROVED, 6, 2026))
            .thenReturn(new BigDecimal("500.00")); // 500 + 200 = 700 <= 1000
        when(claimRepository.save(any(ExpenseClaim.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ClaimResponse res = claimService.approveClaim(1L, reviewReq);

        assertNotNull(res);
        assertEquals(ClaimStatus.APPROVED, res.getStatus());
        assertEquals("Looks good", res.getReviewRemark());
        verify(claimRepository, times(1)).save(any(ExpenseClaim.class));
    }

    @Test
    void testApproveClaim_ExceedsBudget() {
        ReviewRequest reviewReq = new ReviewRequest("Approved");
        pendingClaim.setAmount(new BigDecimal("600.00")); // 600 + 500 = 1100 > 1000
        
        when(claimRepository.findById(1L)).thenReturn(Optional.of(pendingClaim));
        when(budgetRepository.findByDepartmentAndMonthAndYear(Department.ENGINEERING, 6, 2026))
            .thenReturn(Optional.of(budget));
        when(claimRepository.sumByDepartmentStatusMonthYear(Department.ENGINEERING, ClaimStatus.APPROVED, 6, 2026))
            .thenReturn(new BigDecimal("500.00"));

        BudgetConflictException exception = assertThrows(BudgetConflictException.class, () -> {
            claimService.approveClaim(1L, reviewReq);
        });

        assertTrue(exception.getMessage().contains("exceed the department's monthly budget"));
        verify(claimRepository, never()).save(any(ExpenseClaim.class));
    }

    @Test
    void testApproveClaim_NoBudgetDefined() {
        ReviewRequest reviewReq = new ReviewRequest("Approved");
        
        when(claimRepository.findById(1L)).thenReturn(Optional.of(pendingClaim));
        when(budgetRepository.findByDepartmentAndMonthAndYear(Department.ENGINEERING, 6, 2026))
            .thenReturn(Optional.empty());

        BudgetConflictException exception = assertThrows(BudgetConflictException.class, () -> {
            claimService.approveClaim(1L, reviewReq);
        });

        assertTrue(exception.getMessage().contains("No budget defined"));
        verify(claimRepository, never()).save(any(ExpenseClaim.class));
    }

    @Test
    void testApproveClaim_AlreadyProcessed() {
        pendingClaim.setStatus(ClaimStatus.APPROVED);
        ReviewRequest reviewReq = new ReviewRequest("Approved again");
        
        when(claimRepository.findById(1L)).thenReturn(Optional.of(pendingClaim));

        InvalidClaimStateException exception = assertThrows(InvalidClaimStateException.class, () -> {
            claimService.approveClaim(1L, reviewReq);
        });

        assertEquals("Only pending claims can be approved.", exception.getMessage());
        verify(claimRepository, never()).save(any(ExpenseClaim.class));
    }

    @Test
    void testRejectClaim_Success() {
        ReviewRequest reviewReq = new ReviewRequest("Missing receipts");
        
        when(claimRepository.findById(1L)).thenReturn(Optional.of(pendingClaim));
        when(claimRepository.save(any(ExpenseClaim.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ClaimResponse res = claimService.rejectClaim(1L, reviewReq);

        assertNotNull(res);
        assertEquals(ClaimStatus.REJECTED, res.getStatus());
        assertEquals("Missing receipts", res.getReviewRemark());
        verify(claimRepository, times(1)).save(any(ExpenseClaim.class));
    }

    @Test
    void testRejectClaim_MissingRemark() {
        ReviewRequest reviewReq = new ReviewRequest(""); // empty remark
        
        when(claimRepository.findById(1L)).thenReturn(Optional.of(pendingClaim));

        InvalidClaimStateException exception = assertThrows(InvalidClaimStateException.class, () -> {
            claimService.rejectClaim(1L, reviewReq);
        });

        assertEquals("Review remark is required for rejection.", exception.getMessage());
        verify(claimRepository, never()).save(any(ExpenseClaim.class));
    }
}
