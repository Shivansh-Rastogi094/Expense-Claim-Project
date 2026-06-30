package com.monocept.app.controller;

import com.monocept.app.dto.BudgetRequest;
import com.monocept.app.dto.BudgetResponse;
import com.monocept.app.dto.BudgetUpdateRequest;
import com.monocept.app.enums.Department;
import com.monocept.app.service.BudgetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @PostMapping
    public ResponseEntity<BudgetResponse> createBudget(@Valid @RequestBody BudgetRequest req) {
        BudgetResponse response = budgetService.createBudget(req);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BudgetResponse> updateBudget(
            @PathVariable Long id,
            @Valid @RequestBody BudgetUpdateRequest req) {
        BudgetResponse response = budgetService.updateBudget(id, req);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<BudgetResponse>> getAllBudgets(
            @RequestParam(required = false) Department department,
            @RequestParam(required = false) Integer year) {
        List<BudgetResponse> response = budgetService.getAllBudgets(department, year);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BudgetResponse> getBudgetById(@PathVariable Long id) {
        BudgetResponse response = budgetService.getBudgetById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/lookup")
    public ResponseEntity<BudgetResponse> lookupBudget(
            @RequestParam Department department,
            @RequestParam Integer month,
            @RequestParam Integer year) {
        BudgetResponse response = budgetService.lookupBudget(department, month, year);
        return ResponseEntity.ok(response);
    }
}
