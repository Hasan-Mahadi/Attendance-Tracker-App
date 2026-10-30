# AIExpertsBD Attendance Tracker

> A modern, secure, full-stack enterprise workforce attendance, leave, payroll, performance, and office expense management system built for **AIExpertsBD**.

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14%20App%20Router-black.svg)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-REST%20API-green.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg)](https://tailwindcss.com/)

---

## Features Overview

### 1. Attendance & Shift Management
- **Asia/Dhaka (UTC+6) Standard**: Shift hours from 09:00 AM to 06:00 PM (Sun-Thu workweek).
- **Grace Period Calculation**: Configurable 10-minute late grace period with on-time and respectful late notifications.
- **Lunch Breaks**: Real-time Lunch Out / Lunch In tracking with automatic net working duration calculation.
- **Half-Day Classification**: Configurable 240-minute minimum threshold for half days.
- **Attendance Corrections**: Audited correction request and administrative approval workflow.

### 2. Leave Management & Auditable Ledger
- **Configurable Categories**: Sick Leave (SL), Casual Leave (CL), Annual Leave (AL), Emergency Leave (EL), and Unpaid Leave (UL).
- **Atomic Leave Ledger**: `LeaveLedgerEntry` prevents duplicate balance deductions or balance leakage.
- **Full-Day & Half-Day Leaves**: 0.5 day deduction support for medical appointments and emergency half-days.
- **Administrative Queue**: Multi-role approval/rejection queue with review notes.

### 3. Salary & Payroll Engine
- **Configurable 30-Day Divisor**: Daily rate derived dynamically; handles unpaid absences and half-day deductions.
- **Integer Minor Units**: All monetary amounts stored as integer paisa (৳1 = 100 paisa) to eliminate rounding errors.
- **Live Payroll Preview**: Admin can preview payroll calculations across all staff for any month/year before finalization.
- **Immutable Frozen Snapshots**: Finalizing a payroll period freezes `policySnapshot`, `salarySnapshot`, and `attendanceSnapshot`. Historical records are never modified by future settings changes.
- **Itemized Payslips**: Employee and Admin printable itemized payslips.

### 4. Performance Bonus Engine
- **Attendance Bonus Thresholds**: Max 2 late days, min 90% attendance, 0 unexcused absences.
- **Configured Reward**: ৳2,000 monthly attendance bonus automatically added to payroll upon qualification.
- **Leaderboards**: Staff punctuality rankings and liability forecasts.

### 5. Office Expenses & Financials
- **Overhead Tracking**: Rent, high-speed internet, electricity, supplies, software subscriptions, maintenance.
- **Financial Analytics**: Total monthly company expenditure (Payroll + Office Expenses) and Year-to-Date totals.

### 6. Security, RBAC & Provisioning
- **Employee ID Registration**: Only authorized, HR-provisioned Employee IDs with valid one-time invitation codes can register.
- **Session Security**: Short-lived JWT access tokens + rotating `HttpOnly` refresh tokens with reuse detection.
- **Least-Privilege Authorization**: Server-side RBAC enforces strict resource ownership. Staff can never view another employee's records.
- **Formula Injection Defense**: All CSV exports sanitize `=`, `+`, `-`, `@` prefixes.

---

## Repository Structure

```
attendance-tracker/
├── frontend/             # Next.js 14 App Router, TypeScript, Tailwind CSS
├── backend/              # Node.js, Express, TypeScript, Mongoose REST API
├── docs/                 # Architectural & engineering specifications
│   ├── architecture.md
│   ├── database-design.md
│   ├── api-documentation.md
│   ├── attendance-and-payroll-rules.md
│   ├── deployment.md
│   └── security.md
└── README.md
```

---

## Quickstart & Local Setup

### Prerequisites
- **Node.js**: v20+ LTS
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or MongoDB Atlas connection URI

### 1. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Run database seed (Initializes Super Admin, Departments, Schedules, & Demo Staff)
npm run seed

# Start development server
npm run dev
# Backend runs at http://localhost:5000
# OpenAPI / Swagger Docs at http://localhost:5000/api/v1/docs
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Start Next.js development server
npm run dev
# Frontend runs at http://localhost:3000
```

---

## Seed Accounts

When seeded, the following accounts are initialized for testing:

| Role | Employee ID | Email | Password |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `AIE-001` | `admin@aiexpertsbd.com` | `Admin12345!` |
| **HR Admin** | `AIE-002` | `hr@aiexpertsbd.com` | `HrAdmin12345!` |
| **Employee** | `AIE-003` | `tanvir@aiexpertsbd.com` | `Employee12345!` |

---

## Running Automated Tests

```bash
cd backend
npm test
```

Includes unit tests verifying:
- Dhaka timezone normalization (UTC+6)
- 10-minute late grace period logic
- Net working hours deducting lunch break
- Half-day working duration thresholds
- Daily rate divisor calculations in integer paisa
- Absence and half-day salary deductions
- Performance bonus eligibility criteria
- CSV formula injection sanitization

---

## Deployment

- **Frontend**: Deploy `frontend/` to **Vercel** with `NEXT_PUBLIC_API_URL`.
- **Backend**: Deploy `backend/` to **Render** with `npm install && npm run build` and `npm start`.
- **Database**: Connect to **MongoDB Atlas**.
- Detailed steps available in [`docs/deployment.md`](file:///c:/projects/Attendence-Tracker/docs/deployment.md).
