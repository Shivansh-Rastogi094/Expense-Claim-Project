package com.monocept.app.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.monocept.app.enums.Department;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    @GetMapping
    public ResponseEntity<List<String>> getDepartments() {
        List<String> departments = Arrays.stream(Department.values())
            .map(Enum::name)
            .collect(Collectors.toList());
        return ResponseEntity.ok(departments);
    }
}
