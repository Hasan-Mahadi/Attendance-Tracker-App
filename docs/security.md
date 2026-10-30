# Security Architecture & Hardening — AIExpertsBD

## 1. Authentication Lifecycle

### Dual-Token Standard
- **Access Tokens**: Short-lived (15 minutes), signed with `JWT_ACCESS_SECRET`. Encodes `{ userId, employeeId, role, email }`. Kept strictly in memory by the frontend Axios client. Never stored in `localStorage` or `sessionStorage` to mitigate Cross-Site Scripting (XSS) risks.
- **Refresh Tokens**: Cryptographically random 64-byte hex string, stored in `HttpOnly`, `Secure`, `SameSite` cookies.
  - Server stores only the SHA-256 hash of the token (`tokenHash`).
  - Refresh tokens belong to a unique `family` identifier.

### Token Rotation & Automatic Reuse Detection
1. When `/api/v1/auth/refresh` is requested, the current refresh token is revoked and immediately rotated to a new token in the same family.
2. If an expired or already-revoked token is presented, the system detects a potential session compromise or replay attack. It immediately **revokes all tokens within that entire token family**, forcing any attacker and the legitimate user to re-authenticate.

### Password Hashing & Timing-Safe Verification
- Passwords hashed using `bcryptjs` with 12 salt rounds.
- Passwords are never returned in queries (`select: false` on `passwordHash`).
- Reset tokens are generated via `crypto.randomBytes(32)` and stored exclusively as SHA-256 hashes with 60-minute expiration.

---

## 2. Server-Side Role-Based Access Control (RBAC)

Authorization is enforced exclusively at the backend API layer using middleware:

1. `authenticate`: Verifies JWT validity, rejects expired tokens, and injects `req.user`.
2. `authorize(...allowedRoles)`: Checks `req.user.role`.
   - `super_admin`: System configuration, audit logs, all employee records, payroll finalization.
   - `hr_admin`: Employee profile provisioning, invitation generation, leave approvals, attendance adjustments.
   - `employee`: Least-privilege access. Restricted strictly to records where `employee._id === req.user.employeeId`.

**Resource Ownership Enforcement**:
Employees can never access another staff member's attendance, salary profile, or payslip by manipulating query parameters or URLs. In all employee-facing endpoints, identity is derived server-side from `req.user.employeeId`.

---

## 3. Account Lockout & Abuse Protection

- **Brute Force Defense**: Accounts are temporarily locked for 30 minutes after 5 consecutive failed login attempts (`LOCKOUT.MAX_ATTEMPTS`).
- **Rate Limiting**:
  - `authLimiter`: Strict 5 requests per 15-minute window for `/auth/login` and `/auth/register`.
  - `apiLimiter`: 100 requests per 15-minute window for standard API routes.
- **No Public Enumeration**: `/auth/login` returns a generic `"Invalid login credentials"` regardless of whether the Employee ID or password was invalid. `/auth/forgot-password` returns success unconditionally.

---

## 4. Injection & Data Sanitization

- **CSV Formula Injection**: All exported CSV files (employees, attendance, payroll) sanitize user-controlled fields using `sanitizeCsvValue()`. Any value starting with `=`, `+`, `-`, `@`, or tab is prefixed with a single quote (`'`), neutralizing spreadsheet formula execution in Microsoft Excel and Google Sheets.
- **MongoDB Query Injection**: Mongoose strictly checks types and parses query parameters.
