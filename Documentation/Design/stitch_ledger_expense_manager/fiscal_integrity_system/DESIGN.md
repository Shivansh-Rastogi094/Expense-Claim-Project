---
name: Fiscal Integrity System
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
  status-pending: '#F59E0B'
  status-approved: '#10B981'
  status-rejected: '#EF4444'
  surface-muted: '#F8FAFC'
  border-subtle: '#E2E8F0'
typography:
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  margin-page: 2rem
  gutter-grid: 1.5rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
---

# Design Document — Department Expense Approval System

## 1. Overview
A finance-domain web app where employees submit expense claims and a Finance
Manager reviews them against a department's monthly budget. No authentication
(per SRS Out of Scope).

Stack: Java 17, Spring Boot 3, Spring Data JPA, MySQL, ReactJS, Axios.

---

## 2. Entity-Relationship Design

```
ExpenseClaim                         DepartmentBudget
-------------                        -----------------
id (PK)                              id (PK)
employeeName                         department
department        <---- compared by department/month/year ---->  month
category                                                          year
amount                                                            budgetAmount
expenseDate
description
status (PENDING/APPROVED/REJECTED)
reviewRemark
createdAt
updatedAt
```

There is no foreign key between the two tables — they are correlated at
query/service time by `department + month(expenseDate) + year(expenseDate)`.
This keeps the schema simple and matches the SRS, which never asks for a
`Department` master table.

### 2.1 ExpenseClaim

| Field | Type | Constraints |
|---|---|---|
| id | Long | PK, auto-increment |
| employeeName | String | NOT NULL |
| department | String | NOT NULL |
| category | Enum (TRAVEL, FOOD, ACCOMMODATION, OFFICE_SUPPLIES, EQUIPMENT, OTHER) | NOT NULL |
| amount | BigDecimal(10,2) | NOT NULL, > 0 |
| expenseDate | LocalDate | NOT NULL |
| description | String(500) | optional |
| status | Enum (PENDING, APPROVED, REJECTED) | NOT NULL, default PENDING |
| reviewRemark | String(500) | nullable until reviewed |
| createdAt | LocalDateTime | auto-set on insert |
| updatedAt | LocalDateTime | auto-set on update |

### 2.2 DepartmentBudget

| Field | Type | Constraints |
|---|---|---|
| id | Long | PK, auto-increment |
| department | String | NOT NULL |
| month | Integer | NOT NULL, 1–12 |
| year | Integer | NOT NULL |
| budgetAmount | BigDecimal(12,2) | NOT NULL, > 0 |
| | | UNIQUE (department, month, year) |

---

## 3. Business Logic

### 3.1 Claim Submission (FR-1)
- Always created with `status = PENDING`, regardless of payload.
- Validation: amount > 0; department, category, expenseDate, employeeName required.

### 3.2 Claim Review (FR-2)
- `approve` and `reject` are the only allowed transitions, and only from
  `PENDING` (validation rule: "Only pending claims can be approved or rejected").
- A `reviewRemark` is required on both approve and reject.

### 3.3 Budget Control (FR-4) — core logic
On `approve`:
1. Derive `month`/`year` from the claim's `expenseDate`.
2. Look up `DepartmentBudget` for (department, month, year). If none exists →
   reject the approval with 409 ("No budget defined for this department/month").
3. Compute `currentApprovedTotal` = SUM(amount) of all claims in that
   department/month/year with status = APPROVED.
4. If `currentApprovedTotal + thisClaim.amount > budget.budgetAmount` → reject
   the approval with 409 (budget would be exceeded). The claim stays PENDING.
5. Otherwise, set status = APPROVED and persist.

Rejected claims never enter the approved-total calculation, satisfying
"Rejected claims should not affect budget usage."

### 3.4 Monthly Finance Summary (FR-6)
For a given (department, month, year):
- `monthlyBudget` = budget.budgetAmount (0 if none defined)
- `totalApprovedExpense` = SUM(amount) where status = APPROVED
- `totalPendingExpense` = SUM(amount) where status = PENDING
- `remainingBudget` = monthlyBudget - totalApprovedExpense
- `pendingCount`, `approvedCount`, `rejectedCount` = COUNT(*) grouped by status

---

## 4. API Specification

Base URL: `http://localhost:8080/api`

### 4.1 POST /claims
Request:
```json
{
  "employeeName": "Riya Sharma",
  "department": "Engineering",
  "category": "TRAVEL",
  "amount": 4500.00,
  "expenseDate": "2026-06-15",
  "description": "Client site visit"
}
```
Response `201 Created`:
```json
{
  "id": 1,
  "employeeName": "Riya Sharma",
  "department": "Engineering",
  "category": "TRAVEL",
  "amount": 4500.00,
  "expenseDate": "2026-06-15",
  "description": "Client site visit",
  "status": "PENDING",
  "reviewRemark": null,
  "createdAt": "2026-06-30T10:00:00"
}
```

### 4.2 GET /claims?department=&month=&year=&status=&category=
All query params optional. Returns `200 OK` with an array of claims.

### 4.3 GET /claims/{id}
`200 OK` with the claim, or `404 Not Found`.

### 4.4 PUT /claims/{id}/approve
Request:
```json
{ "reviewRemark": "Within budget, approved." }
```
- `200 OK` with updated claim on success.
- `409 Conflict` if claim is not PENDING, no budget exists, or budget would be exceeded.

### 4.5 PUT /claims/{id}/reject
Request:
```json
{ "reviewRemark": "Missing valid bill." }
```
- `200 OK` with updated claim. `409 Conflict` if claim is not PENDING.

### 4.6 POST /budgets
Request:
```json
{
  "department": "Engineering",
  "month": 6,
  "year": 2026,
  "budgetAmount": 50000.00
}
```
- `201 Created`. `409 Conflict` if a budget already exists for that
  department/month/year.

### 4.7 GET /budgets?department=&year=
Returns array of budgets.

### 4.8 GET /budgets/lookup?department=&month=&year=
Returns single budget or `404 Not Found`.

### 4.9 PUT /budgets/{id}
Request: `{ "budgetAmount": 55000.00 }` → `200 OK`.

### 4.10 GET /summary?department=&month=&year=
Response `200 OK`:
```json
{
  "department": "Engineering",
  "month": 6,
  "year": 2026,
  "monthlyBudget": 50000.00,
  "totalApprovedExpense": 4500.00,
  "totalPendingExpense": 1200.00,
  "remainingBudget": 45500.00,
  "pendingCount": 1,
  "approvedCount": 1,
  "rejectedCount": 0
}
```

---

## 5. Validation Rules (mapped to FR/section 6)

| Rule | Enforced where |
|---|---|
| Expense amount > 0 | Bean Validation (`@DecimalMin`) on ClaimRequest DTO |
| Department required | `@NotBlank` on both ClaimRequest and BudgetRequest |
| Expense category required | `@NotNull` on ClaimRequest |
| Expense date required | `@NotNull` on ClaimRequest |
| Budget amount > 0 | `@DecimalMin` on BudgetRequest |
| No duplicate budget (dept+month+year) | DB unique constraint + service-level check → 409 |
| Only pending claims can be approved/rejected | Service-level status check → 409 |

---

## 6. Error Response Shape (global exception handler)
```json
{
  "timestamp": "2026-06-30T10:05:00",
  "status": 409,
  "error": "Conflict",
  "message": "Approving this claim would exceed the department's monthly budget."
}
```

## 7. Frontend Screens (maps to SRS Section 7)
1. **Submit Claim** — form posting to `/claims`
2. **Claims List** — table with filter bar (department/month/year/status/category) calling `GET /claims`
3. **Review Claim** — approve/reject buttons + remark field, calls approve/reject endpoints
4. **Budget Management** — create/list/edit department budgets
5. **Monthly Summary** — department + month/year picker, displays summary card
