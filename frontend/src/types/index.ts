// ============================================================================
// Enums
// ============================================================================

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  HR_ADMIN = 'hr_admin',
  EMPLOYEE = 'employee',
}

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  HALF_DAY = 'half_day',
  ON_LEAVE = 'on_leave',
  HOLIDAY = 'holiday',
  WEEKEND = 'weekend',
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum PayrollStatus {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export enum EmploymentStatus {
  ACTIVE = 'active',
  ON_PROBATION = 'on_probation',
  ON_LEAVE = 'on_leave',
  SUSPENDED = 'suspended',
  TERMINATED = 'terminated',
  RESIGNED = 'resigned',
}

export enum ExpenseStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REIMBURSED = 'reimbursed',
}

// ============================================================================
// Core Models
// ============================================================================

export interface User {
  id: string;
  employee_id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

export interface Employee {
  id: string;
  user_id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  department_id: string | null;
  department?: Department;
  designation: string | null;
  date_of_joining: string;
  employment_status: EmploymentStatus;
  profile_image_url: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_name: string | null;
  bank_branch: string | null;
  base_salary: number;
  work_schedule_id: string | null;
  work_schedule?: WorkSchedule;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  head_employee_id: string | null;
  head_employee?: Employee;
  parent_department_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkSchedule {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  break_duration_minutes: number;
  working_days: number[];
  is_flexible: boolean;
  grace_period_minutes: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Attendance
// ============================================================================

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee?: Employee;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: AttendanceStatus;
  work_hours: number | null;
  overtime_hours: number | null;
  late_minutes: number | null;
  early_leave_minutes: number | null;
  notes: string | null;
  ip_address: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Leave Management
// ============================================================================

export interface LeaveCategory {
  id: string;
  name: string;
  description: string | null;
  default_days: number;
  is_paid: boolean;
  is_carry_forward: boolean;
  max_carry_forward_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  employee?: Employee;
  leave_category_id: string;
  leave_category?: LeaveCategory;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: LeaveStatus;
  reviewed_by: string | null;
  reviewer?: Employee;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  employee?: Employee;
  leave_category_id: string;
  leave_category?: LeaveCategory;
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
  carried_forward_days: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Payroll
// ============================================================================

export interface PayrollPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: PayrollStatus;
  created_by: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollRecord {
  id: string;
  employee_id: string;
  employee?: Employee;
  payroll_period_id: string;
  payroll_period?: PayrollPeriod;
  base_salary: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  total_working_days: number;
  days_worked: number;
  overtime_hours: number;
  overtime_pay: number;
  late_deduction: number;
  absence_deduction: number;
  tax_deduction: number;
  other_deductions: number;
  other_deductions_note: string | null;
  bonuses: number;
  bonuses_note: string | null;
  allowances: number;
  allowances_note: string | null;
  status: PayrollStatus;
  paid_at: string | null;
  payment_method: string | null;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Performance
// ============================================================================

export interface PerformanceEvaluation {
  id: string;
  employee_id: string;
  employee?: Employee;
  evaluator_id: string;
  evaluator?: Employee;
  period_start: string;
  period_end: string;
  overall_rating: number;
  productivity_rating: number;
  quality_rating: number;
  teamwork_rating: number;
  communication_rating: number;
  punctuality_rating: number;
  strengths: string | null;
  areas_for_improvement: string | null;
  goals: string | null;
  comments: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Expenses
// ============================================================================

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
  budget_limit: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExpenseRecord {
  id: string;
  category_id: string;
  category?: ExpenseCategory;
  submitted_by: string;
  submitter?: Employee;
  amount: number;
  description: string;
  receipt_url: string | null;
  expense_date: string;
  status: ExpenseStatus;
  approved_by: string | null;
  approver?: Employee;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Notifications
// ============================================================================

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_read: boolean;
  link: string | null;
  created_at: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: PaginationMeta;
}

// ============================================================================
// Dashboard Stats
// ============================================================================

export interface DashboardStats {
  total_employees: number;
  present_today: number;
  absent_today: number;
  on_leave_today: number;
  pending_leave_requests: number;
  late_today: number;
  average_work_hours: number;
  attendance_rate: number;
}

export interface EmployeeDashboardStats {
  attendance_rate: number;
  total_working_days: number;
  days_present: number;
  days_absent: number;
  late_count: number;
  leave_balance: LeaveBalance[];
  total_work_hours: number;
  average_work_hours: number;
}
