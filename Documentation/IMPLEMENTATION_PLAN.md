# Implementation Plan — Department Expense Approval System

This plan turns `DESIGN.md` into an actual file/class layout so you can start
typing instead of deciding structure mid-build. Follow the package layout
exactly — don't reorganize mid-project, you don't have the time budget for it.

---

## 1. Backend — Project Structure

```
expense-approval-backend/
└── src/main/java/com/expense/approval/
    ├── ExpenseApprovalApplication.java
    ├── entity/
    │   ├── ExpenseClaim.java
    │   ├── DepartmentBudget.java
    │   ├── ClaimStatus.java        (enum)
    │   └── ExpenseCategory.java    (enum)
    ├── repository/
    │   ├── ExpenseClaimRepository.java
    │   └── DepartmentBudgetRepository.java
    ├── dto/
    │   ├── ClaimRequest.java
    │   ├── ClaimResponse.java
    │   ├── ReviewRequest.java
    │   ├── BudgetRequest.java
    │   ├── BudgetResponse.java
    │   └── SummaryResponse.java
    ├── service/
    │   ├── ClaimService.java
    │   ├── BudgetService.java
    │   └── SummaryService.java
    ├── controller/
    │   ├── ClaimController.java
    │   ├── BudgetController.java
    │   └── SummaryController.java
    ├── exception/
    │   ├── ResourceNotFoundException.java
    │   ├── BudgetConflictException.java
    │   ├── InvalidClaimStateException.java
    │   └── GlobalExceptionHandler.java
    └── config/
        └── CorsConfig.java
```

Build order matters: entity → repository → DTO → service → controller →
exception handler → CORS config. Don't write controllers before services —
you'll end up putting business logic in the wrong layer under time pressure.

---

## 2. Entity Layer

### 2.1 `ClaimStatus.java`
```java
public enum ClaimStatus { PENDING, APPROVED, REJECTED }
```

### 2.2 `ExpenseCategory.java`
```java
public enum ExpenseCategory {
    TRAVEL, FOOD, ACCOMMODATION, OFFICE_SUPPLIES, EQUIPMENT, OTHER
}
```

### 2.3 `ExpenseClaim.java`
Key annotations:
- `@Entity`, `@Table(name = "expense_claims")`
- `@Id @GeneratedValue(strategy = GenerationType.IDENTITY)`
- `@Enumerated(EnumType.STRING)` on `category` and `status` (never store enums
  as ORDINAL — reordering the enum later silently corrupts data)
- `@Column(nullable = false, precision = 10, scale = 2)` on `amount`
- `@PrePersist` sets `createdAt = LocalDateTime.now()` and `status = PENDING`
  unconditionally (do not trust a status value from the request body)
- `@PreUpdate` sets `updatedAt = LocalDateTime.now()`

### 2.4 `DepartmentBudget.java`
- `@Entity`, `@Table(name = "department_budgets", uniqueConstraints = @UniqueConstraint(columnNames = {"department","month","year"}))`
- This DB-level constraint is your safety net; the service-level check
  (Section 4.2) is what produces the clean 409 response — don't rely on the
  DB constraint alone or you'll leak a raw `DataIntegrityViolationException`
  to the client.

---

## 3. Repository Layer

### 3.1 `ExpenseClaimRepository`
```java
public interface ExpenseClaimRepository extends JpaRepository<ExpenseClaim, Long> {

    List<ExpenseClaim> findByDepartmentAndStatusAndCategory(
        String department, ClaimStatus status, ExpenseCategory category);

    @Query("SELECT c FROM ExpenseClaim c WHERE " +
           "(:department IS NULL OR c.department = :department) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:category IS NULL OR c.category = :category) AND " +
           "(:month IS NULL OR MONTH(c.expenseDate) = :month) AND " +
           "(:year IS NULL OR YEAR(c.expenseDate) = :year)")
    List<ExpenseClaim> search(
        @Param("department") String department,
        @Param("status") ClaimStatus status,
        @Param("category") ExpenseCategory category,
        @Param("month") Integer month,
        @Param("year") Integer year);

    @Query("SELECT COALESCE(SUM(c.amount),0) FROM ExpenseClaim c WHERE " +
           "c.department = :department AND c.status = :status AND " +
           "MONTH(c.expenseDate) = :month AND YEAR(c.expenseDate) = :year")
    BigDecimal sumByDepartmentStatusMonthYear(
        @Param("department") String department,
        @Param("status") ClaimStatus status,
        @Param("month") int month,
        @Param("year") int year);

    long countByDepartmentAndStatusAndExpenseDateBetween(
        String department, ClaimStatus status, LocalDate start, LocalDate end);
}
```
One JPQL `search` method handles all of FR-5's filter combinations — avoid
writing five separate `findByX` methods, it's wasted time for the same result.
Use `LocalDate.of(year, month, 1)` and `.withDayOfMonth(lengthOfMonth())` to
build start/end bounds for the count query if you'd rather avoid `MONTH()`/
`YEAR()` SQL functions (both approaches are fine — pick one and move on).

### 3.2 `DepartmentBudgetRepository`
```java
public interface DepartmentBudgetRepository extends JpaRepository<DepartmentBudget, Long> {
    Optional<DepartmentBudget> findByDepartmentAndMonthAndYear(
        String department, Integer month, Integer year);
    List<DepartmentBudget> findByDepartmentAndYear(String department, Integer year);
}
```

---

## 4. Service Layer (this is where your 4 hours are actually spent)

### 4.1 `ClaimService.submitClaim(ClaimRequest req)`
1. Map DTO → entity (ignore any `status` field if present in the request DTO —
   better yet, don't put a `status` field on `ClaimRequest` at all).
2. Save via repository. `@PrePersist` handles status/createdAt.
3. Map entity → `ClaimResponse`, return.

### 4.2 `ClaimService.approveClaim(Long id, ReviewRequest req)`
```
claim = repository.findById(id) or throw ResourceNotFoundException
if claim.status != PENDING:
    throw InvalidClaimStateException("Only pending claims can be approved.")

month = claim.expenseDate.getMonthValue()
year  = claim.expenseDate.getYear()

budget = budgetRepository.findByDepartmentAndMonthAndYear(claim.department, month, year)
         or throw BudgetConflictException("No budget defined for this department/month.")

approvedTotal = claimRepository.sumByDepartmentStatusMonthYear(
                    claim.department, APPROVED, month, year)

if approvedTotal + claim.amount > budget.budgetAmount:
    throw BudgetConflictException(
        "Approving this claim would exceed the department's monthly budget. " +
        "Available: " + (budget.budgetAmount - approvedTotal))

claim.status = APPROVED
claim.reviewRemark = req.reviewRemark
save(claim)
return mapToResponse(claim)
```
This block is the single most important piece of logic in the whole project —
it's explicitly named in the Acceptance Criteria. Write a quick manual test
for it before moving to the frontend (submit two claims that together exceed
budget, approve the first, confirm the second 409s).

### 4.3 `ClaimService.rejectClaim(Long id, ReviewRequest req)`
Same PENDING check as above, but no budget logic — just set
`status = REJECTED`, `reviewRemark = req.reviewRemark`, save.

### 4.4 `ClaimService.searchClaims(department, month, year, status, category)`
Thin pass-through to `repository.search(...)`, mapping each result to
`ClaimResponse`.

### 4.5 `BudgetService.createBudget(BudgetRequest req)`
```
existing = repository.findByDepartmentAndMonthAndYear(req.department, req.month, req.year)
if existing.isPresent():
    throw BudgetConflictException("A budget already exists for this department/month/year.")
save(new DepartmentBudget(...))
```

### 4.6 `BudgetService.updateBudget(Long id, BudgetRequest req)`
Find or throw `ResourceNotFoundException`; update `budgetAmount` only (don't
allow department/month/year to be changed via update — that's effectively
creating a new budget through the back door and would let someone dodge the
duplicate check).

### 4.7 `SummaryService.getSummary(department, month, year)`
```
budget = budgetRepository.findByDepartmentAndMonthAndYear(...)
budgetAmount = budget.map(b -> b.budgetAmount).orElse(ZERO)

approvedTotal = claimRepository.sumByDepartmentStatusMonthYear(department, APPROVED, month, year)
pendingTotal  = claimRepository.sumByDepartmentStatusMonthYear(department, PENDING, month, year)

pendingCount  = countByDepartmentAndStatus(department, PENDING, month, year)
approvedCount = countByDepartmentAndStatus(department, APPROVED, month, year)
rejectedCount = countByDepartmentAndStatus(department, REJECTED, month, year)

remaining = budgetAmount - approvedTotal

return new SummaryResponse(department, month, year, budgetAmount,
    approvedTotal, pendingTotal, remaining,
    pendingCount, approvedCount, rejectedCount)
```
If no budget exists, return the summary anyway with `monthlyBudget = 0` and a
negative `remainingBudget` rather than 404ing — the SRS doesn't say a summary
is invalid without a budget, and a 404 here would just create extra frontend
error-handling work you don't need.

---

## 5. Controller Layer

Keep controllers thin — validate via `@Valid`, delegate to service, return
`ResponseEntity`. No business logic here.

```java
@RestController
@RequestMapping("/api/claims")
@RequiredArgsConstructor
public class ClaimController {

    private final ClaimService claimService;

    @PostMapping
    public ResponseEntity<ClaimResponse> submit(@Valid @RequestBody ClaimRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(claimService.submitClaim(req));
    }

    @GetMapping
    public ResponseEntity<List<ClaimResponse>> list(
        @RequestParam(required = false) String department,
        @RequestParam(required = false) Integer month,
        @RequestParam(required = false) Integer year,
        @RequestParam(required = false) ClaimStatus status,
        @RequestParam(required = false) ExpenseCategory category) {
        return ResponseEntity.ok(claimService.searchClaims(department, month, year, status, category));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClaimResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(claimService.getById(id));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ClaimResponse> approve(@PathVariable Long id, @Valid @RequestBody ReviewRequest req) {
        return ResponseEntity.ok(claimService.approveClaim(id, req));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ClaimResponse> reject(@PathVariable Long id, @Valid @RequestBody ReviewRequest req) {
        return ResponseEntity.ok(claimService.rejectClaim(id, req));
    }
}
```

`BudgetController` and `SummaryController` follow the same thin pattern —
mirror the endpoint table in `DESIGN.md` Section 4 exactly, don't improvise
extra endpoints.

---

## 6. DTOs (validation lives here)

```java
public class ClaimRequest {
    @NotBlank private String employeeName;
    @NotBlank private String department;
    @NotNull  private ExpenseCategory category;
    @NotNull @DecimalMin(value = "0.01") private BigDecimal amount;
    @NotNull  private LocalDate expenseDate;
    private String description; // optional
}

public class ReviewRequest {
    @NotBlank private String reviewRemark;
}

public class BudgetRequest {
    @NotBlank private String department;
    @NotNull @Min(1) @Max(12) private Integer month;
    @NotNull private Integer year;
    @NotNull @DecimalMin(value = "0.01") private BigDecimal budgetAmount;
}
```
Use Lombok `@Data` on all DTOs/entities to skip boilerplate getters/setters —
non-negotiable time saver for a 4-hour build.

---

## 7. Exception Handling

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> notFound(ResourceNotFoundException ex) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler({BudgetConflictException.class, InvalidClaimStateException.class})
    public ResponseEntity<ErrorResponse> conflict(RuntimeException ex) {
        return build(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> validation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .map(f -> f.getField() + ": " + f.getDefaultMessage())
            .collect(Collectors.joining(", "));
        return build(HttpStatus.BAD_REQUEST, message);
    }

    private ResponseEntity<ErrorResponse> build(HttpStatus status, String message) {
        return ResponseEntity.status(status)
            .body(new ErrorResponse(LocalDateTime.now(), status.value(), status.getReasonPhrase(), message));
    }
}
```
This is what makes your Postman 400/404/409 test cases actually return the
shape documented in `DESIGN.md` Section 6 instead of Spring's default error
page.

---

## 8. CORS Config
```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:5173") // or :3000 for CRA
            .allowedMethods("GET", "POST", "PUT", "DELETE");
    }
}
```
Add this in the setup hour, not when React throws CORS errors at 3:35 — it's
a 2-minute fix now versus a confused 10-minute debug later.

---

## 9. Frontend — Project Structure

```
expense-approval-frontend/
└── src/
    ├── api/
    │   └── apiClient.js          (axios instance, baseURL)
    ├── components/
    │   ├── ClaimForm.jsx
    │   ├── ClaimList.jsx
    │   ├── ClaimFilters.jsx
    │   ├── ReviewPanel.jsx
    │   ├── BudgetForm.jsx
    │   ├── BudgetList.jsx
    │   └── SummaryCard.jsx
    ├── pages/
    │   ├── SubmitClaimPage.jsx
    │   ├── ClaimsPage.jsx        (list + filters)
    │   ├── ReviewPage.jsx
    │   ├── BudgetsPage.jsx
    │   └── SummaryPage.jsx
    ├── App.jsx                   (routes)
    └── main.jsx
```

### 9.1 `api/apiClient.js`
```js
import axios from "axios";
export default axios.create({ baseURL: "http://localhost:8080/api" });
```
Every component imports this single instance — don't scatter raw `axios.get`
calls with hardcoded URLs across components.

### 9.2 Routing (`App.jsx`)
```jsx
<Routes>
  <Route path="/" element={<SubmitClaimPage />} />
  <Route path="/claims" element={<ClaimsPage />} />
  <Route path="/review" element={<ReviewPage />} />
  <Route path="/budgets" element={<BudgetsPage />} />
  <Route path="/summary" element={<SummaryPage />} />
</Routes>
```
Simple top nav with 5 links. No nested routing, no auth guards (auth is out
of scope) — resist the urge to add a login screen "just in case."

### 9.3 Component responsibilities
- **ClaimForm** — controlled inputs for the 6 required fields, posts to
  `/claims`, shows server validation errors inline (parse `message` from the
  error response).
- **ClaimFilters** — 5 dropdown/text inputs, lifts filter state up to
  `ClaimsPage`, which re-fetches on change.
- **ClaimList** — table rendering claims, status shown as a colored badge.
- **ReviewPanel** — shown per-row or as a modal when a PENDING claim is
  clicked; two buttons (Approve/Reject) each opening a small remark input,
  calling the respective endpoint, then refreshing the list.
- **BudgetForm / BudgetList** — same create+list pattern as claims, scoped to
  `/budgets`.
- **SummaryCard** — department + month/year selector, displays the 7 summary
  fields from `SummaryResponse` in a simple grid (no charts — out of scope).

### 9.4 Error handling pattern (use everywhere)
```js
try {
  const res = await apiClient.post("/claims", payload);
  // success
} catch (err) {
  setError(err.response?.data?.message ?? "Something went wrong.");
}
```
Reuse this exact try/catch shape in every component that calls the API —
don't write a different error-handling style each time.

---

## 10. Build Order Checklist (tie back to the roadmap)

1. [ ] Entities + enums compile, schema auto-generates correctly (`spring.jpa.hibernate.ddl-auto=update`)
2. [ ] Repositories compile, no query syntax errors
3. [ ] DTOs with validation annotations
4. [ ] ClaimService + BudgetService + SummaryService — manually trace the
       approve-budget-check logic once on paper before coding it
5. [ ] Controllers wired, exception handler returns clean JSON
6. [ ] Postman collection run end-to-end (this is your real "backend done" gate)
7. [ ] React skeleton + routing + apiClient
8. [ ] 5 components built against the now-verified backend
9. [ ] Integration click-through
10. [ ] README + AI usage log + screenshots

Do not start step 7 before step 6 passes — building UI against an unverified
budget-check endpoint is the single most likely way to blow your 4-hour
budget on rework.
