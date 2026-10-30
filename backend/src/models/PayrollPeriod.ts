import mongoose, { Schema, Document, Model } from 'mongoose';
import { PayrollPeriodStatuses, PayrollPeriodStatus } from '../config/constants.js';

export interface IPayrollPeriod extends Document {
  _id: mongoose.Types.ObjectId;
  month: number; // 1-12
  year: number;
  startDate: Date;
  endDate: Date;
  status: PayrollPeriodStatus;
  processedBy?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  finalizedAt?: Date;
  totalGrossEarnings: number; // in paisa
  totalDeductions: number; // in paisa
  totalNetPayable: number; // in paisa
  totalBonuses: number; // in paisa
  employeeCount: number;
  policy?: mongoose.Types.ObjectId;
  policySnapshot?: Record<string, unknown>; // Frozen policy snapshot
  createdAt: Date;
  updatedAt: Date;
}

const payrollPeriodSchema = new Schema<IPayrollPeriod>(
  {
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PayrollPeriodStatuses),
      default: PayrollPeriodStatuses.DRAFT,
      index: true,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    finalizedAt: {
      type: Date,
    },
    totalGrossEarnings: {
      type: Number,
      default: 0,
    },
    totalDeductions: {
      type: Number,
      default: 0,
    },
    totalNetPayable: {
      type: Number,
      default: 0,
    },
    totalBonuses: {
      type: Number,
      default: 0,
    },
    employeeCount: {
      type: Number,
      default: 0,
    },
    policy: {
      type: Schema.Types.ObjectId,
      ref: 'PayrollPolicy',
    },
    policySnapshot: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

payrollPeriodSchema.index({ month: 1, year: 1 }, { unique: true });

export const PayrollPeriod: Model<IPayrollPeriod> =
  mongoose.model<IPayrollPeriod>('PayrollPeriod', payrollPeriodSchema);
