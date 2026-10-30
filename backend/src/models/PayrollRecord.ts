import mongoose, { Schema, Document, Model } from 'mongoose';
import { PayrollRecordStatuses, PayrollRecordStatus } from '../config/constants.js';

export interface IPayrollRecord extends Document {
  _id: mongoose.Types.ObjectId;
  payrollPeriod: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  baseSalary: number; // in paisa
  workingDays: number;
  daysPresent: number;
  daysAbsent: number;
  daysOnPaidLeave: number;
  daysOnUnpaidLeave: number;
  halfDays: number;
  holidays: number;
  weeklyOffs: number;
  lateDays: number;
  totalLateMinutes: number;
  grossEarnings: number; // in paisa
  absentDeductions: number; // in paisa
  halfDayDeductions: number; // in paisa
  unpaidLeaveDeductions: number; // in paisa
  lateDeductions: number; // in paisa
  otherDeductions: number; // in paisa
  totalDeductions: number; // in paisa
  performanceBonus: number; // in paisa
  otherEarnings: number; // in paisa
  adjustments: number; // in paisa (positive or negative)
  netPayable: number; // in paisa
  status: PayrollRecordStatus;
  policySnapshot?: Record<string, unknown>;
  attendanceSnapshot?: Record<string, unknown>;
  salarySnapshot?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const payrollRecordSchema = new Schema<IPayrollRecord>(
  {
    payrollPeriod: {
      type: Schema.Types.ObjectId,
      ref: 'PayrollPeriod',
      required: true,
      index: true,
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    baseSalary: {
      type: Number,
      required: true,
    },
    workingDays: {
      type: Number,
      default: 0,
    },
    daysPresent: {
      type: Number,
      default: 0,
    },
    daysAbsent: {
      type: Number,
      default: 0,
    },
    daysOnPaidLeave: {
      type: Number,
      default: 0,
    },
    daysOnUnpaidLeave: {
      type: Number,
      default: 0,
    },
    halfDays: {
      type: Number,
      default: 0,
    },
    holidays: {
      type: Number,
      default: 0,
    },
    weeklyOffs: {
      type: Number,
      default: 0,
    },
    lateDays: {
      type: Number,
      default: 0,
    },
    totalLateMinutes: {
      type: Number,
      default: 0,
    },
    grossEarnings: {
      type: Number,
      default: 0,
    },
    absentDeductions: {
      type: Number,
      default: 0,
    },
    halfDayDeductions: {
      type: Number,
      default: 0,
    },
    unpaidLeaveDeductions: {
      type: Number,
      default: 0,
    },
    lateDeductions: {
      type: Number,
      default: 0,
    },
    otherDeductions: {
      type: Number,
      default: 0,
    },
    totalDeductions: {
      type: Number,
      default: 0,
    },
    performanceBonus: {
      type: Number,
      default: 0,
    },
    otherEarnings: {
      type: Number,
      default: 0,
    },
    adjustments: {
      type: Number,
      default: 0,
    },
    netPayable: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(PayrollRecordStatuses),
      default: PayrollRecordStatuses.DRAFT,
      index: true,
    },
    policySnapshot: {
      type: Schema.Types.Mixed,
    },
    attendanceSnapshot: {
      type: Schema.Types.Mixed,
    },
    salarySnapshot: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

payrollRecordSchema.index({ payrollPeriod: 1, employee: 1 }, { unique: true });

export const PayrollRecord: Model<IPayrollRecord> =
  mongoose.model<IPayrollRecord>('PayrollRecord', payrollRecordSchema);
