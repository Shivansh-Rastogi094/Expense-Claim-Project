**Mini Project SRS**

**Project Title: Department Expense Approval System**

 

**1. Project Objective**

Build a finance-domain web application where employees can submit expense claims and the finance team can review, approve, reject, and monitor department-wise monthly budget usage.

The application must help the company track expenses, control spending, and view the financial status of each department for a selected month.

 

**2. Technology Scope**

The project must be developed using:

• Java

• Spring Boot

• MySQL

• ReactJS

• AI tool: Claude or GPT

 

**3. Project Duration**

The project must be completed within **4 hours**.

 

**4. Users**

The system will have two user types:

1. Employee

2. Finance Manager

Authentication is not required.

 

1

**5. Functional Requirements**

**FR-1: Expense Claim Submission**

An employee should be able to submit an expense claim.

Each claim must include:

• Employee name

• Department

• Expense category

• Amount

• Expense date

• Description

• Claim status

A newly submitted claim must have the status Pending .

 

**FR-2: Expense Claim Review**

The Finance Manager should be able to review all submitted claims.

The Finance Manager should be able to:

• Approve a pending claim

• Reject a pending claim

• Add a review remark

Once a claim is approved or rejected, its final status should be clearly visible.

 

**FR-3: Department Budget Management**

The system should allow monthly budget amounts to be maintained for departments.

Each department can have only one budget for a particular month and year.

 

**FR-4: Budget Control**

The system should not allow approval of a claim if the approval causes the department’s monthly budget to be exceeded.

Rejected claims should not affect budget usage.

 

2

Pending claims should be visible separately from approved expenses.

 

**FR-5: Expense Tracking**

The system should allow users to view expense claims based on:

• Department

• Month and year

• Claim status

• Expense category

 

**FR-6: Monthly Finance Summary**

The system should show a monthly financial summary for each department.

The summary must include:

• Monthly budget

• Total approved expense

• Total pending expense

• Remaining budget

• Number of pending claims

• Number of approved claims

• Number of rejected claims

 

**6. Validation Rules**

The system must ensure that:

• Expense amount is greater than zero

• Department is required

• Expense category is required

• Expense date is required

• Monthly budget amount is greater than zero

• Duplicate department budget for the same month and year is not allowed

• Only pending claims can be approved or rejected

 

3

**7. Expected Screens**

The application should contain screens for:

1. Expense claim submission

2. Expense claim listing and filtering

3. Claim review

4. Department budget management

5. Monthly finance summary

 

**8. Expected Deliverables**

Each trainee must submit:

1. Backend source code

2. Frontend source code

3. Database setup details

4. Working application screenshots

5. README file

6. AI usage log

 

**9. Out of Scope**

The following features are not required:

• Login and registration

• JWT security

• Email notifications

• Payment gateway

• File upload

• Advanced analytics

• Charts and graphs

• Multi-branch finance workflow

 

**10. Acceptance Criteria**

The project will be considered complete if:

• Employees can submit expense claims

• Finance Manager can approve and reject pending claims

• Department-wise monthly budget can be maintained

• Claims cannot be approved beyond available department budget

 

4

• Monthly summary shows correct budget and expense information

• Filters work correctly

• Basic validation and error handling are present

• Frontend and backend are integrated

• The trainee can explain the project flow, logic, and AI usage clearly

 

5



