# Architecture Documentation — AIExpertsBD Attendance Tracker

## 1. System Overview

The **AIExpertsBD Attendance Tracker** is an enterprise-grade private workforce, attendance, leave, payroll, performance, and office expense management web application. It is engineered with a strict decoupled client-server architecture:

```
[ Frontend: Next.js 14 (App Router) ] 
       │ (HTTPS / REST API / HttpOnly Cookies)
       ▼
[ Backend: Node.js + Express + TypeScript ]
       │ (Mongoose ODM / TCP)
       ▼
[ Database: MongoDB Atlas ]
```

## 2. Technology Stack

### Frontend
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS with custom design tokens
- **Data Visualization**: Recharts for workforce and financial analytics
- **Icons**: Lucide React
- **Forms & Validation**: React Hook Form with Zod schema validation
- **HTTP Client**: Axios with in-memory JWT access token store & refresh queue

### Backend
- **Runtime**: Node.js v20+ LTS
- **Framework**: Express.js
- **Language**: TypeScript (strict mode, NodeNext module resolution)
- **Data Access**: Mongoose 8+
- **Security & Headers**: Helmet, CORS with explicit origin allowlist, express-rate-limit
- **Authentication**: JWT access tokens (15m) + rotating HttpOnly refresh tokens (7d)
- **Hashing**: bcryptjs with 12 salt rounds; SHA-256 for token hashes
- **Logging**: Winston with structured JSON in production & request IDs

### Database
- **Database**: MongoDB Atlas
- **Storage Conventions**:
  - **Financial Minor Units**: All monetary values stored as integer paisa (1 BDT = 100 paisa)
  - **Dates & Times**: Stored in UTC, converted to Asia/Dhaka (UTC+6) for all business and calendar rules
  - **Audit Logging**: Immutable event ledger recording administrative actions with previous and new data

---

## 3. Layered Backend Architecture

```
backend/src/
├── config/             # Typed environment configs, constants, database connection
├── middleware/         # Auth, RBAC, input validation, rate limiting, request ID, error handling
├── models/             # Mongoose schemas, compound unique indexes, typed models
├── modules/            # Domain modules (auth, employees, attendance, leave, payroll, etc.)
│   ├── auth/           # Login, registration, token rotation, password recovery
│   ├── employees/      # Employee CRUD, invitations, salary profiles, CSV export
│   ├── departments/    # Department management
│   ├── attendance/     # Check-in/out, lunch breaks, late calculations, corrections
│   ├── leave/          # Leave categories, policies, ledger accounting, approvals
│   ├── holidays/       # Official company holiday calendar
│   ├── payroll/        # 30-day divisor calculation engine, preview, frozen snapshots
│   ├── performance/    # Punctuality thresholds, bonus evaluation engine
│   ├── expenses/       # Office expenses & company-wide financial summaries
│   ├── reports/        # Monthly & yearly attendance/absence reports, CSV export
│   ├── settings/       # Company profile, workweek & shift configurations
│   ├── notifications/  # In-app notification center
│   ├── audit/          # Administrative audit trail
│   └── dashboard/      # Role-specific analytics endpoints
├── types/              # Extended Express interfaces
├── utils/              # Standardized ApiResponse, ApiError, logger, CSV sanitizers
├── app.ts              # Express application factory
└── server.ts           # HTTP server bootstrap & graceful shutdown lifecycle
```

---

## 4. Frontend App Router Architecture

```
frontend/src/
├── app/
│   ├── (auth)/         # Unauthenticated layouts and screens
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (dashboard)/    # Authenticated main application screens
│   │   ├── attendance/
│   │   ├── leave/
│   │   ├── employees/
│   │   ├── payroll/
│   │   ├── performance/
│   │   ├── reports/
│   │   ├── expenses/
│   │   ├── settings/
│   │   └── audit-logs/
│   ├── page.tsx        # Role-aware interactive dashboard overview
│   ├── unauthorized/   # 403 Access Denied view
│   ├── not-found.tsx   # 404 Not Found view
│   ├── layout.tsx      # Root layout with Auth & Toast providers
│   └── globals.css     # Tailwind directives & CSS variables
├── components/
│   ├── layout/         # Persistent Sidebar, Topbar, MainLayout shell
│   └── ui/             # Reusable design system (Button, Modal, Table, Badge, Card, etc.)
├── hooks/              # useAuth context, useToast notifications
├── lib/                # Axios API client with refresh interceptor, utility formatters
└── types/              # TypeScript models, enums, API response types
```
