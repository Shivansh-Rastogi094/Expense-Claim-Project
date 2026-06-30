package com.monocept.app.repository;

import com.monocept.app.entity.ExpenseClaim;
import com.monocept.app.enums.ClaimStatus;
import com.monocept.app.enums.Department;
import com.monocept.app.enums.ExpenseCategory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.util.List;

public interface ExpenseClaimRepository extends JpaRepository<ExpenseClaim, Long> {

    @Query("SELECT c FROM ExpenseClaim c WHERE " +
           "(:department IS NULL OR c.department = :department) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:category IS NULL OR c.category = :category) AND " +
           "(:month IS NULL OR MONTH(c.expenseDate) = :month) AND " +
           "(:year IS NULL OR YEAR(c.expenseDate) = :year)")
    List<ExpenseClaim> search(
        @Param("department") Department department,
        @Param("status") ClaimStatus status,
        @Param("category") ExpenseCategory category,
        @Param("month") Integer month,
        @Param("year") Integer year);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM ExpenseClaim c WHERE " +
           "c.department = :department AND c.status = :status AND " +
           "MONTH(c.expenseDate) = :month AND YEAR(c.expenseDate) = :year")
    BigDecimal sumByDepartmentStatusMonthYear(
        @Param("department") Department department,
        @Param("status") ClaimStatus status,
        @Param("month") int month,
        @Param("year") int year);

    @Query("SELECT COUNT(c) FROM ExpenseClaim c WHERE " +
           "c.department = :department AND c.status = :status AND " +
           "MONTH(c.expenseDate) = :month AND YEAR(c.expenseDate) = :year")
    long countByDepartmentStatusMonthYear(
        @Param("department") Department department,
        @Param("status") ClaimStatus status,
        @Param("month") int month,
        @Param("year") int year);
}
