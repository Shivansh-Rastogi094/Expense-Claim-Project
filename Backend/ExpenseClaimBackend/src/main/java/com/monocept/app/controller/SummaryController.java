package com.monocept.app.controller;

import com.monocept.app.dto.SummaryResponse;
import com.monocept.app.enums.Department;
import com.monocept.app.service.SummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/summary")
@RequiredArgsConstructor
public class SummaryController {

    private final SummaryService summaryService;

    @GetMapping
    public ResponseEntity<SummaryResponse> getSummary(
            @RequestParam Department department,
            @RequestParam Integer month,
            @RequestParam Integer year) {
        SummaryResponse response = summaryService.getSummary(department, month, year);
        return ResponseEntity.ok(response);
    }
}
