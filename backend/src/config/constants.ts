/**
 * Application-wide constants and enumerations.
 */

/** User roles */
export const Roles = {
  SUPER_ADMIN: 'super_admin',
  HR_ADMIN: 'hr_admin',
  EMPLOYEE: 'employee',
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

/** Employment type */
export const EmploymentTypes = {
  FULL_TIME: 'full_time',
  PART_TIME: 'part_time',
  CONTRACT: 'contract',
  INTERN: 'intern',
} as const;

export type EmploymentType = (typeof EmploymentTypes)[keyof typeof EmploymentTypes];

/** Employment status */
export const EmploymentStatuses = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  TERMINATED: 'terminated',
  RESIGNED: 'resigned',
  ON_NOTICE: 'on_notice',
} as const;

export type EmploymentStatus = (typeof EmploymentStatuses)[keyof typeof EmploymentStatuses];

/** Attendance status */
export const AttendanceStatuses = {
  PRESENT: 'present',
  LATE: 'late',
  HALF_DAY: 'half_day',
  ABSENT: 'absent',
  ON_LEAVE: 'on_leave',
  HOLIDAY: 'holiday',
  WEEKLY_OFF: 'weekly_off',
  IN_PROGRESS: 'in_progress',
  INCOMPLETE: 'incomplete',
  EARLY_DEPARTURE: 'early_departure',
} as const;

export type AttendanceStatus = (typeof AttendanceStatuses)[keyof typeof AttendanceStatuses];

/** Attendance approval status */
export const ApprovalStatuses = {
  AUTO_APPROVED: 'auto_approved',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type ApprovalStatus = (typeof ApprovalStatuses)[keyof typeof ApprovalStatuses];

/** Attendance correction status */
export const CorrectionStatuses = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type CorrectionStatus = (typeof CorrectionStatuses)[keyof typeof CorrectionStatuses];

/** Leave request status */
export const LeaveStatuses = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

export type LeaveStatus = (typeof LeaveStatuses)[keyof typeof LeaveStatuses];

/** Leave ledger entry type */
export const LeaveLedgerTypes = {
  ALLOCATION: 'allocation',
  ACCRUAL: 'accrual',
  CARRY_FORWARD: 'carry_forward',
  DEDUCTION: 'deduction',
  CANCELLATION: 'cancellation',
  ADJUSTMENT: 'adjustment',
  EXPIRY: 'expiry',
} as const;

export type LeaveLedgerType = (typeof LeaveLedgerTypes)[keyof typeof LeaveLedgerTypes];

/** Payroll period status */
export const PayrollPeriodStatuses = {
  DRAFT: 'draft',
  PROCESSING: 'processing',
  PREVIEW: 'preview',
  APPROVED: 'approved',
  FINALIZED: 'finalized',
} as const;

export type PayrollPeriodStatus = (typeof PayrollPeriodStatuses)[keyof typeof PayrollPeriodStatuses];

/** Payroll record status */
export const PayrollRecordStatuses = {
  DRAFT: 'draft',
  APPROVED: 'approved',
  FINALIZED: 'finalized',
} as const;

export type PayrollRecordStatus = (typeof PayrollRecordStatuses)[keyof typeof PayrollRecordStatuses];

/** Payroll adjustment type */
export const PayrollAdjustmentTypes = {
  EARNING: 'earning',
  DEDUCTION: 'deduction',
  CORRECTION: 'correction',
} as const;

export type PayrollAdjustmentType = (typeof PayrollAdjustmentTypes)[keyof typeof PayrollAdjustmentTypes];

/** Rounding method for payroll calculations */
export const RoundingMethods = {
  ROUND: 'round',
  FLOOR: 'floor',
  CEIL: 'ceil',
} as const;

export type RoundingMethod = (typeof RoundingMethods)[keyof typeof RoundingMethods];

/** Payment method for expenses */
export const PaymentMethods = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  CHECK: 'check',
  CARD: 'card',
  ONLINE: 'online',
  OTHER: 'other',
} as const;

export type PaymentMethod = (typeof PaymentMethods)[keyof typeof PaymentMethods];

/** Expense approval status */
export const ExpenseApprovalStatuses = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type ExpenseApprovalStatus = (typeof ExpenseApprovalStatuses)[keyof typeof ExpenseApprovalStatuses];

/** Notification type */
export const NotificationTypes = {
  ATTENDANCE: 'attendance',
  LEAVE: 'leave',
  PAYROLL: 'payroll',
  PERFORMANCE: 'performance',
  SYSTEM: 'system',
  EXPENSE: 'expense',
} as const;

export type NotificationType = (typeof NotificationTypes)[keyof typeof NotificationTypes];

/** Performance evaluation status */
export const PerformanceEvaluationStatuses = {
  DRAFT: 'draft',
  APPROVED: 'approved',
  FINALIZED: 'finalized',
} as const;

export type PerformanceEvaluationStatus =
  (typeof PerformanceEvaluationStatuses)[keyof typeof PerformanceEvaluationStatuses];

/** Default timezone for business logic */
export const DEFAULT_TIMEZONE = 'Asia/Dhaka';

/** Default currency */
export const DEFAULT_CURRENCY = 'BDT';

/** Default currency symbol */
export const DEFAULT_CURRENCY_SYMBOL = '৳';

/** Account lockout settings */
export const LOCKOUT = {
  MAX_ATTEMPTS: 5,
  DURATION_MINUTES: 30,
} as const;

/** Password reset token expiry in minutes */
export const PASSWORD_RESET_TOKEN_EXPIRY_MINUTES = 60;

/** Invitation code expiry in hours */
export const INVITATION_EXPIRY_HOURS = 72;
