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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BudgetServiceTest {

    @Mock
    private DepartmentBudgetRepository budgetRepository;

    @Mock
    private ExpenseClaimRepository claimRepository;

    @InjectMocks
    private BudgetService budgetService;

    private DepartmentBudget existingBudget;

    @BeforeEach
    void setUp() {
        existingBudget = DepartmentBudget.builder()
            .id(1L)
            .department(Department.ENGINEERING)
            .month(6)
            .year(2026)
            .budgetAmount(new BigDecimal("1000.00"))
            .build();
    }

    @Test
    void testCreateBudget_Success() {
        BudgetRequest req = new BudgetRequest(Department.ENGINEERING, 6, 2026, new BigDecimal("1000.00"));
        
        when(budgetRepository.findByDepartmentAndMonthAndYear(Department.ENGINEERING, 6, 2026))
            .thenReturn(Optional.empty());
        when(budgetRepository.save(any(DepartmentBudget.class))).thenAnswer(invocation -> {
            DepartmentBudget b = invocation.getArgument(0);
            b.setId(1L);
            return b;
        });

        BudgetResponse res = budgetService.createBudget(req);

        assertNotNull(res);
        assertEquals(1L, res.getId());
        assertEquals(Department.ENGINEERING, res.getDepartment());
        assertEquals(6, res.getMonth());
        assertEquals(2026, res.getYear());
        assertEquals(new BigDecimal("1000.00"), res.getBudgetAmount());
        verify(budgetRepository, times(1)).save(any(DepartmentBudget.class));
    }

    @Test
    void testCreateBudget_AlreadyExists() {
        BudgetRequest req = new BudgetRequest(Department.ENGINEERING, 6, 2026, new BigDecimal("1000.00"));
        
        when(budgetRepository.findByDepartmentAndMonthAndYear(Department.ENGINEERING, 6, 2026))
            .thenReturn(Optional.of(existingBudget));

        BudgetConflictException exception = assertThrows(BudgetConflictException.class, () -> {
            budgetService.createBudget(req);
        });

        assertTrue(exception.getMessage().contains("already exists"));
        verify(budgetRepository, never()).save(any(DepartmentBudget.class));
    }

    @Test
    void testUpdateBudget_Success() {
        BudgetUpdateRequest req = new BudgetUpdateRequest(new BigDecimal("800.00"));
        
        when(budgetRepository.findById(1L)).thenReturn(Optional.of(existingBudget));
        when(claimRepository.sumByDepartmentStatusMonthYear(Department.ENGINEERING, ClaimStatus.APPROVED, 6, 2026))
            .thenReturn(new BigDecimal("500.00")); // 500 <= 800 (Success)
        when(budgetRepository.save(any(DepartmentBudget.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BudgetResponse res = budgetService.updateBudget(1L, req);

        assertNotNull(res);
        assertEquals(new BigDecimal("800.00"), res.getBudgetAmount());
        verify(budgetRepository, times(1)).save(any(DepartmentBudget.class));
    }

    @Test
    void testUpdateBudget_BelowApprovedClaims() {
        BudgetUpdateRequest req = new BudgetUpdateRequest(new BigDecimal("400.00"));
        
        when(budgetRepository.findById(1L)).thenReturn(Optional.of(existingBudget));
        when(claimRepository.sumByDepartmentStatusMonthYear(Department.ENGINEERING, ClaimStatus.APPROVED, 6, 2026))
            .thenReturn(new BigDecimal("500.00")); // 500 > 400 (Failure!)

        BudgetConflictException exception = assertThrows(BudgetConflictException.class, () -> {
            budgetService.updateBudget(1L, req);
        });

        assertTrue(exception.getMessage().contains("Cannot reduce budget amount below the sum of already-approved claims"));
        verify(budgetRepository, never()).save(any(DepartmentBudget.class));
    }

    @Test
    void testUpdateBudget_NotFound() {
        BudgetUpdateRequest req = new BudgetUpdateRequest(new BigDecimal("1200.00"));
        
        when(budgetRepository.findById(1L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            budgetService.updateBudget(1L, req);
        });

        assertTrue(exception.getMessage().contains("not found"));
        verify(budgetRepository, never()).save(any(DepartmentBudget.class));
    }
}
