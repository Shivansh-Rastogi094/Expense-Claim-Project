package com.monocept.app.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

import com.monocept.app.enums.Department;

@Entity
@Table(
    name = "department_budgets",
    uniqueConstraints = @UniqueConstraint(columnNames = {"department", "month", "year"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentBudget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Department department;

    @Column(nullable = false)
    private Integer month;

    @Column(nullable = false)
    private Integer year;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal budgetAmount;
}
