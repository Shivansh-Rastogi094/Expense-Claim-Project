package com.monocept.app.controller;

import com.monocept.app.dto.ClaimRequest;
import com.monocept.app.dto.ClaimResponse;
import com.monocept.app.dto.ReviewRequest;
import com.monocept.app.enums.ClaimStatus;
import com.monocept.app.enums.Department;
import com.monocept.app.enums.ExpenseCategory;
import com.monocept.app.service.ClaimService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/claims")
@RequiredArgsConstructor
public class ClaimController {

    private final ClaimService claimService;

    @PostMapping
    public ResponseEntity<ClaimResponse> submitClaim(@Valid @RequestBody ClaimRequest req) {
        ClaimResponse response = claimService.submitClaim(req);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<ClaimResponse>> searchClaims(
            @RequestParam(required = false) Department department,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) ClaimStatus status,
            @RequestParam(required = false) ExpenseCategory category) {
        List<ClaimResponse> response = claimService.searchClaims(department, month, year, status, category);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClaimResponse> getClaimById(@PathVariable Long id) {
        ClaimResponse response = claimService.getById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ClaimResponse> approveClaim(
            @PathVariable Long id,
            @RequestBody(required = false) ReviewRequest req) {
        // If request body is empty, pass an empty ReviewRequest
        ReviewRequest reviewRequest = (req != null) ? req : new ReviewRequest(null);
        ClaimResponse response = claimService.approveClaim(id, reviewRequest);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ClaimResponse> rejectClaim(
            @PathVariable Long id,
            @RequestBody(required = false) ReviewRequest req) {
        ReviewRequest reviewRequest = (req != null) ? req : new ReviewRequest(null);
        ClaimResponse response = claimService.rejectClaim(id, reviewRequest);
        return ResponseEntity.ok(response);
    }
}
