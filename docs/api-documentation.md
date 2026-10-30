# REST API Specification — AIExpertsBD Attendance Tracker

All endpoints are versioned under `/api/v1`.

## 1. Authentication & Session Security (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public (Rate-limited) | Register employee account using assigned Employee ID + one-time invitation code |
| `POST` | `/auth/login` | Public (Rate-limited) | Authenticate with Employee ID or email + password; issues access token & HttpOnly refresh cookie |
| `POST` | `/auth/refresh` | Public (Cookie) | Rotating refresh-token exchange with automated token family reuse detection |
| `POST` | `/auth/logout` | Authenticated | Revoke active refresh session and clear cookie |
| `POST` | `/auth/logout-all` | Authenticated | Invalidate all active sessions for current user across all devices |
| `POST` | `/auth/forgot-password` | Public | Generate timed password reset token |
| `POST` | `/auth/reset-password` | Public | Reset password with valid token and invalidate previous sessions |
| `POST` | `/auth/change-password` | Authenticated | Update password with current password verification |
| `GET` | `/auth/me` | Authenticated | Return currently authenticated user profile and employee linkage |

---

## 2. Employees & Provisioning (`/api/v1/employees`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/employees` | Admin / HR | List employees with pagination, search, department, and status filters |
| `POST` | `/employees` | Admin / HR | Create new employee profile and optional initial salary profile |
| `POST` | `/employees/invitations` | Admin / HR | Generate one-time registration invitation code linked to Employee ID |
| `GET` | `/employees/:id` | Authenticated | View employee profile (Staff can only view own; Admin/HR view all) |
| `PATCH` | `/employees/:id` | Admin / HR | Update employee details (audited in AuditLog) |
| `PUT` | `/employees/:id/salary` | Super Admin / HR | Update employee monthly base salary profile and effective date |
| `GET` | `/employees/export/csv` | Admin / HR | Export authorized employee directory to CSV |

---

## 3. Attendance Management (`/api/v1/attendance`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/attendance/today` | Authenticated | Retrieve current user's today attendance status and timing |
| `POST` | `/attendance/check-in` | Authenticated | Record check-in; evaluates scheduled joining time and 10m grace period |
| `POST` | `/attendance/check-out` | Authenticated | Record check-out; computes gross, lunch break, and net working duration |
| `POST` | `/attendance/lunch-out` | Authenticated | Record lunch break commencement |
| `POST` | `/attendance/lunch-in` | Authenticated | Record lunch break conclusion; computes total lunch minutes |
| `GET` | `/attendance/my` | Authenticated | Personal monthly / range attendance history |
| `GET` | `/attendance` | Admin / HR | Company-wide attendance table with date, department, and status filters |
| `POST` | `/attendance/corrections` | Authenticated | Submit attendance correction request with reasons |
| `PATCH` | `/attendance/corrections/:id` | Admin / HR | Approve or reject attendance correction |
| `POST` | `/attendance/manual` | Admin / HR | Record administrative manual attendance entry/override |

---

## 4. Leave Management (`/api/v1/leave`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/leave/categories` | Authenticated | List active leave categories (Sick, Casual, Annual, etc.) |
| `GET` | `/leave/policies` | Authenticated | List leave allocation policies and rules |
| `GET` | `/leave/balances/my` | Authenticated | Get current user's annual leave balances and used days |
| `POST` | `/leave/requests` | Authenticated | Submit leave request; verifies balance and creates pending request |
| `GET` | `/leave/requests/my` | Authenticated | View personal leave history and request statuses |
| `POST` | `/leave/requests/:id/cancel` | Authenticated | Cancel personal leave request (restores balances if approved) |
| `GET` | `/leave/requests` | Admin / HR | Company-wide leave request approval queue |
| `PATCH` | `/leave/requests/:id/review` | Admin / HR | Approve or reject leave request; updates balances and attendance |

---

## 5. Salary & Payroll (`/api/v1/payroll`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/payroll/my-payslips` | Authenticated | List finalized payslips for current authenticated employee |
| `GET` | `/payroll/records/:id` | Authenticated | Get detailed itemized payslip breakdown (own or admin) |
| `GET` | `/payroll/policy` | Admin / HR | View active payroll configuration policy |
| `PUT` | `/payroll/policy/:id` | Super Admin | Update payroll policy (divisor, deduction rates, rounding) |
| `POST` | `/payroll/preview` | Admin / HR | Calculate live preview for any month/year without finalization |
| `POST` | `/payroll/finalize` | Admin / HR | Finalize and freeze payroll period snapshot permanently |
| `GET` | `/payroll/periods` | Admin / HR | List all historical payroll periods |
| `GET` | `/payroll/periods/:id/records` | Admin / HR | View all employee records in a finalized period |

---

## 6. Performance & Bonus (`/api/v1/performance`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/performance/policy` | Authenticated | Retrieve active bonus eligibility policy rules |
| `GET` | `/performance/my` | Authenticated | View personal monthly punctuality and bonus scores |
| `GET` | `/performance/overview` | Admin / HR | View company-wide monthly performance leaderboard and liabilities |
| `POST` | `/performance/evaluate` | Admin / HR | Compute monthly evaluations for all active staff |

---

## 7. Expenses & Financial Summaries (`/api/v1/expenses`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/expenses/categories` | Admin / HR | List active expense categories |
| `GET` | `/expenses` | Admin / HR | Paginated list of office expenses with filters |
| `POST` | `/expenses` | Admin / HR | Record new office operational expenditure |
| `GET` | `/expenses/summary` | Admin / HR | Financial summary: monthly expenses, payroll, and YTD total |

---

## 8. Reports & Statistics (`/api/v1/reports`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/reports/attendance/monthly` | Authenticated | Monthly employee attendance summary (own or company) |
| `GET` | `/reports/attendance/yearly` | Authenticated | Yearly attendance & absence trends by month |
| `GET` | `/reports/attendance/export/csv` | Admin / HR | Export monthly attendance summary to sanitized CSV |
