import { z } from 'zod';
import { EmploymentTypes, EmploymentStatuses } from '../../config/constants.js';

export const createEmployeeSchema = z.object({
  employeeCode: z.string().trim().min(2, 'Employee code must be at least 2 characters').toUpperCase(),
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  phone: z.string().trim().optional(),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().trim().optional(),
  joiningDate: z.string().or(z.date()).transform((val) => new Date(val)),
  employmentType: z.nativeEnum(EmploymentTypes).default(EmploymentTypes.FULL_TIME),
  reportingManager: z.string().optional(),
  workSchedule: z.string().optional(),
  attendancePolicy: z.string().optional(),
  leavePolicy: z.string().optional(),
  baseSalary: z.number().min(0, 'Base salary must be non-negative').optional(), // in BDT (will be converted to paisa)
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  email: z.string().email().toLowerCase().trim().optional(),
  phone: z.string().trim().optional(),
  department: z.string().optional(),
  designation: z.string().trim().optional(),
  joiningDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
  employmentType: z.nativeEnum(EmploymentTypes).optional(),
  employmentStatus: z.nativeEnum(EmploymentStatuses).optional(),
  reportingManager: z.string().optional().nullable(),
  workSchedule: z.string().optional(),
  attendancePolicy: z.string().optional(),
  leavePolicy: z.string().optional(),
  profileImage: z.string().optional(),
});

export const createInvitationSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  expiresInHours: z.number().int().min(1).max(720).default(72),
});

export const updateSalarySchema = z.object({
  baseSalary: z.number().min(0, 'Base salary must be non-negative'), // in BDT
  effectiveFrom: z.string().or(z.date()).transform((val) => new Date(val)),
  notes: z.string().optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type UpdateSalaryInput = z.infer<typeof updateSalarySchema>;
