export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'AIExpertsBD Attendance Tracker REST API',
    version: '1.0.0',
    description:
      'Enterprise workforce, attendance, leave, payroll, performance, and office expense management REST API for AIExpertsBD.',
    contact: {
      name: 'AIExpertsBD Engineering Team',
      email: 'contact@aiexpertsbd.com',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Base URL',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide your JWT access token (Bearer <token>)',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication, registration, sessions, and passwords' },
    { name: 'Attendance', description: 'Daily attendance, clock in/out, lunch tracking, and corrections' },
    { name: 'Employees', description: 'Employee directory, invitations, and salary profiles' },
    { name: 'Leave', description: 'Leave balances, requests, and administrative approval workflow' },
    { name: 'Payroll', description: '30-day divisor payroll preview, freezing, and itemized payslips' },
    { name: 'Performance', description: 'Attendance bonus policy, eligibility evaluation, and leaderboards' },
    { name: 'Expenses', description: 'Office operational expenses and financial summaries' },
    { name: 'Reports', description: 'Workforce attendance and absence analytics, CSV export' },
    { name: 'Dashboard', description: 'Role-specific dashboard overviews for employees and admins' },
    { name: 'Departments & Holidays', description: 'Organizational departments and official holiday calendar' },
    { name: 'Settings & Security', description: 'System configuration, notifications, audit logs, and health' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Settings & Security'],
        summary: 'System health check',
        security: [],
        responses: {
          200: { description: 'API operational status' },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register employee account with Employee ID and invitation code',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['employeeCode', 'invitationCode', 'password'],
                properties: {
                  employeeCode: { type: 'string', example: 'AIE-003' },
                  invitationCode: { type: 'string', example: 'INV-A1B2C3D4' },
                  password: { type: 'string', example: 'Employee12345!' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Account successfully registered and activated' },
          400: { description: 'Validation error or invalid code' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'User login with Employee ID or email',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['employeeCode', 'password'],
                properties: {
                  employeeCode: { type: 'string', example: 'AIE-001' },
                  password: { type: 'string', example: 'Admin12345!' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Successfully authenticated. Returns access token and sets refresh cookie.' },
          401: { description: 'Invalid credentials or account inactive' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token using HttpOnly refresh cookie',
        security: [],
        responses: {
          200: { description: 'New access token issued' },
          401: { description: 'Invalid or expired refresh token' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout current session and clear cookie',
        responses: {
          200: { description: 'Logged out successfully' },
        },
      },
    },
    '/auth/logout-all': {
      post: {
        tags: ['Auth'],
        summary: 'Logout all active sessions for current user across all devices',
        responses: {
          200: { description: 'All sessions revoked' },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request password reset token via email',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', example: 'admin@aiexpertsbd.com' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Reset instructions sent if email exists' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password with reset token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'newPassword'],
                properties: {
                  token: { type: 'string' },
                  newPassword: { type: 'string', example: 'NewSecret123!' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password reset successfully' },
        },
      },
    },
    '/auth/change-password': {
      post: {
        tags: ['Auth'],
        summary: 'Change current user password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string' },
                  newPassword: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password updated' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get currently authenticated user details',
        responses: {
          200: { description: 'User profile with employee details and permissions' },
        },
      },
    },
    '/attendance/today': {
      get: {
        tags: ['Attendance'],
        summary: 'Get current user today attendance record',
        responses: {
          200: { description: 'Today attendance record or null if not checked in' },
        },
      },
    },
    '/attendance/check-in': {
      post: {
        tags: ['Attendance'],
        summary: 'Employee check-in (calculates late arrival against 10m grace period)',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  notes: { type: 'string', example: 'On-time arrival' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Check-in recorded' },
        },
      },
    },
    '/attendance/check-out': {
      post: {
        tags: ['Attendance'],
        summary: 'Employee check-out (computes net working hours, deducting lunch break)',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Check-out recorded and daily net duration computed' },
        },
      },
    },
    '/attendance/lunch-out': {
      post: {
        tags: ['Attendance'],
        summary: 'Mark lunch start',
        responses: {
          200: { description: 'Lunch break started' },
        },
      },
    },
    '/attendance/lunch-in': {
      post: {
        tags: ['Attendance'],
        summary: 'Mark lunch return (updates lunch duration)',
        responses: {
          200: { description: 'Lunch break concluded' },
        },
      },
    },
    '/attendance/my': {
      get: {
        tags: ['Attendance'],
        summary: 'Get monthly attendance history for current employee',
        parameters: [
          { name: 'month', in: 'query', schema: { type: 'integer' }, example: 10 },
          { name: 'year', in: 'query', schema: { type: 'integer' }, example: 2026 },
        ],
        responses: {
          200: { description: 'List of personal attendance records' },
        },
      },
    },
    '/attendance': {
      get: {
        tags: ['Attendance'],
        summary: 'Company-wide attendance directory (Admin/HR only)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'month', in: 'query', schema: { type: 'integer' } },
          { name: 'year', in: 'query', schema: { type: 'integer' } },
          { name: 'department', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Paginated attendance records' },
        },
      },
    },
    '/attendance/corrections': {
      post: {
        tags: ['Attendance'],
        summary: 'Submit attendance correction request',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['attendanceRecordId', 'reason'],
                properties: {
                  attendanceRecordId: { type: 'string' },
                  proposedCheckIn: { type: 'string', format: 'date-time' },
                  proposedCheckOut: { type: 'string', format: 'date-time' },
                  reason: { type: 'string', example: 'Forgot to click punch-in on biometric device' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Correction request submitted' },
        },
      },
    },
    '/attendance/corrections/{id}': {
      patch: {
        tags: ['Attendance'],
        summary: 'Approve or reject attendance correction (Admin/HR only)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['action'],
                properties: {
                  action: { type: 'string', enum: ['approved', 'rejected'] },
                  reviewNotes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Correction status updated' },
        },
      },
    },
    '/employees': {
      get: {
        tags: ['Employees'],
        summary: 'List employees with pagination and filters (Admin/HR only)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'department', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Paginated employee list' },
        },
      },
      post: {
        tags: ['Employees'],
        summary: 'Create employee profile and initial salary (Admin/HR only)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['employeeCode', 'firstName', 'lastName', 'email', 'department'],
                properties: {
                  employeeCode: { type: 'string', example: 'AIE-004' },
                  firstName: { type: 'string', example: 'Rafiq' },
                  lastName: { type: 'string', example: 'Islam' },
                  email: { type: 'string', example: 'rafiq@aiexpertsbd.com' },
                  department: { type: 'string' },
                  designation: { type: 'string', example: 'Senior AI Engineer' },
                  joiningDate: { type: 'string', format: 'date' },
                  baseSalary: { type: 'number', example: 45000 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Employee created' },
        },
      },
    },
    '/employees/invitations': {
      post: {
        tags: ['Employees'],
        summary: 'Generate registration invitation code for an employee (Admin/HR only)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['employeeId'],
                properties: {
                  employeeId: { type: 'string' },
                  expiresInHours: { type: 'integer', default: 72 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Invitation code generated' },
        },
      },
    },
    '/employees/{id}': {
      get: {
        tags: ['Employees'],
        summary: 'Get employee details by ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Employee details' },
        },
      },
      patch: {
        tags: ['Employees'],
        summary: 'Update employee profile (Admin/HR only)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  phone: { type: 'string' },
                  designation: { type: 'string' },
                  employmentStatus: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Employee updated' },
        },
      },
    },
    '/employees/{id}/salary': {
      put: {
        tags: ['Employees'],
        summary: 'Update employee salary profile (Super Admin / HR only)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['baseSalary'],
                properties: {
                  baseSalary: { type: 'number', example: 50000 },
                  effectiveFrom: { type: 'string', format: 'date' },
                  notes: { type: 'string', example: 'Annual appraisal' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Salary updated' },
        },
      },
    },
    '/leave/categories': {
      get: {
        tags: ['Leave'],
        summary: 'List active leave categories (Sick, Casual, Annual, Unpaid)',
        responses: {
          200: { description: 'List of leave categories' },
        },
      },
    },
    '/leave/balances/my': {
      get: {
        tags: ['Leave'],
        summary: 'Get current employee leave balances',
        responses: {
          200: { description: 'Leave balances and used days' },
        },
      },
    },
    '/leave/requests': {
      get: {
        tags: ['Leave'],
        summary: 'List all leave requests for approval queue (Admin/HR only)',
        responses: {
          200: { description: 'Leave requests list' },
        },
      },
      post: {
        tags: ['Leave'],
        summary: 'Submit new leave request',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['categoryId', 'startDate', 'endDate', 'reason'],
                properties: {
                  categoryId: { type: 'string' },
                  startDate: { type: 'string', format: 'date' },
                  endDate: { type: 'string', format: 'date' },
                  isHalfDay: { type: 'boolean', default: false },
                  reason: { type: 'string', example: 'Medical appointment' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Leave request submitted' },
        },
      },
    },
    '/leave/requests/my': {
      get: {
        tags: ['Leave'],
        summary: 'View current user leave requests',
        responses: {
          200: { description: 'Personal leave request history' },
        },
      },
    },
    '/leave/requests/{id}/review': {
      patch: {
        tags: ['Leave'],
        summary: 'Approve or reject leave request (Admin/HR only)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['approved', 'rejected'] },
                  reviewNotes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Leave review recorded' },
        },
      },
    },
    '/payroll/my-payslips': {
      get: {
        tags: ['Payroll'],
        summary: 'List finalized payslips for current employee',
        responses: {
          200: { description: 'Historical payslips' },
        },
      },
    },
    '/payroll/preview': {
      post: {
        tags: ['Payroll'],
        summary: 'Calculate live monthly payroll preview across all staff (Admin/HR only)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['month', 'year'],
                properties: {
                  month: { type: 'integer', example: 10 },
                  year: { type: 'integer', example: 2026 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Itemized payroll preview breakdown and totals' },
        },
      },
    },
    '/payroll/finalize': {
      post: {
        tags: ['Payroll'],
        summary: 'Finalize and freeze immutable monthly payroll period (Admin/HR only)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['month', 'year'],
                properties: {
                  month: { type: 'integer', example: 10 },
                  year: { type: 'integer', example: 2026 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Payroll period permanently finalized and frozen' },
        },
      },
    },
    '/payroll/periods': {
      get: {
        tags: ['Payroll'],
        summary: 'List historical payroll periods',
        responses: {
          200: { description: 'Payroll periods list' },
        },
      },
    },
    '/performance/policy': {
      get: {
        tags: ['Performance'],
        summary: 'Retrieve active performance & punctuality bonus policy',
        responses: {
          200: { description: 'Bonus threshold policy' },
        },
      },
    },
    '/performance/my': {
      get: {
        tags: ['Performance'],
        summary: 'Get current employee punctuality score and bonus qualification',
        parameters: [
          { name: 'year', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Performance records' },
        },
      },
    },
    '/performance/overview': {
      get: {
        tags: ['Performance'],
        summary: 'Get company-wide monthly punctuality leaderboard and bonus liability (Admin/HR only)',
        parameters: [
          { name: 'month', in: 'query', schema: { type: 'integer' } },
          { name: 'year', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Leaderboard and financial liability summary' },
        },
      },
    },
    '/performance/evaluate': {
      post: {
        tags: ['Performance'],
        summary: 'Run automated monthly performance & bonus evaluation (Admin/HR only)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['month', 'year'],
                properties: {
                  month: { type: 'integer', example: 10 },
                  year: { type: 'integer', example: 2026 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Evaluations calculated for all active staff' },
        },
      },
    },
    '/expenses': {
      get: {
        tags: ['Expenses'],
        summary: 'Paginated list of office operational expenses (Admin/HR only)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'month', in: 'query', schema: { type: 'integer' } },
          { name: 'year', in: 'query', schema: { type: 'integer' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Expenses list and pagination' },
        },
      },
      post: {
        tags: ['Expenses'],
        summary: 'Record new office expenditure (Admin/HR only)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'category', 'amount', 'date'],
                properties: {
                  title: { type: 'string', example: 'High-speed Fiber Internet' },
                  category: { type: 'string' },
                  amount: { type: 'number', example: 4500 },
                  paymentMethod: { type: 'string', example: 'bank_transfer' },
                  date: { type: 'string', format: 'date' },
                  vendor: { type: 'string', example: 'Amber IT' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Expense recorded' },
        },
      },
    },
    '/expenses/summary': {
      get: {
        tags: ['Expenses'],
        summary: 'Total monthly company expenditures (Payroll + Office Expenses) and YTD (Admin/HR only)',
        parameters: [
          { name: 'month', in: 'query', schema: { type: 'integer' } },
          { name: 'year', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Financial summary' },
        },
      },
    },
    '/reports/attendance/monthly': {
      get: {
        tags: ['Reports'],
        summary: 'Monthly attendance aggregate distribution',
        parameters: [
          { name: 'month', in: 'query', schema: { type: 'integer' } },
          { name: 'year', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Monthly attendance statistics' },
        },
      },
    },
    '/reports/attendance/export/csv': {
      get: {
        tags: ['Reports'],
        summary: 'Export attendance report as sanitized CSV',
        parameters: [
          { name: 'month', in: 'query', schema: { type: 'integer' } },
          { name: 'year', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'CSV file download with formula injection protection' },
        },
      },
    },
    '/dashboard/employee': {
      get: {
        tags: ['Dashboard'],
        summary: 'Personal dashboard statistics for current employee',
        responses: {
          200: { description: 'Today attendance, month stats, and leave balances' },
        },
      },
    },
    '/dashboard/admin': {
      get: {
        tags: ['Dashboard'],
        summary: 'Company-wide executive dashboard overview (Admin/HR only)',
        responses: {
          200: { description: 'Today present count, late arrivals, on-leave, pending approvals' },
        },
      },
    },
    '/departments': {
      get: {
        tags: ['Departments & Holidays'],
        summary: 'List departments',
        responses: {
          200: { description: 'Departments list' },
        },
      },
    },
    '/holidays': {
      get: {
        tags: ['Departments & Holidays'],
        summary: 'List official company holidays',
        parameters: [
          { name: 'year', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Holidays list' },
        },
      },
    },
    '/notifications': {
      get: {
        tags: ['Settings & Security'],
        summary: 'Get user notifications and unread count',
        responses: {
          200: { description: 'Notifications list' },
        },
      },
    },
    '/notifications/{id}/read': {
      patch: {
        tags: ['Settings & Security'],
        summary: 'Mark notification as read',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Notification updated' },
        },
      },
    },
    '/notifications/read-all': {
      post: {
        tags: ['Settings & Security'],
        summary: 'Mark all notifications as read',
        responses: {
          200: { description: 'All marked read' },
        },
      },
    },
    '/audit-logs': {
      get: {
        tags: ['Settings & Security'],
        summary: 'List administrative audit logs (Super Admin only)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'action', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Audit trail records' },
        },
      },
    },
  },
};
