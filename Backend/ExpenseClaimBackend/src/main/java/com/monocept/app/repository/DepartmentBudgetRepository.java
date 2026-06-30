package com.monocept.app.repository;

import com.monocept.app.entity.DepartmentBudget;
import com.monocept.app.enums.Department;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DepartmentBudgetRepository extends JpaRepository<DepartmentBudget, Long> {

    Optional<DepartmentBudget> findByDepartmentAndMonthAndYear(
        Department department, Integer month, Integer year);

    List<DepartmentBudget> findByDepartmentAndYear(Department department, Integer year);
}
