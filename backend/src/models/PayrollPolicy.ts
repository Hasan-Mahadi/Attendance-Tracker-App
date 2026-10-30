import mongoose, { Schema, Document, Model } from 'mongoose';
import { RoundingMethods, RoundingMethod } from '../config/constants.js';

export interface IPayrollPolicy extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  workingDayDivisor: number; // e.g. 30 or actual working days
  useActualMonthDays: boolean; // if true, uses 28/29/30/31 of that month
  absentDeductionEnabled: boolean;
  halfDayDeductionRate: number; // e.g. 0.5 (half daily rate)
  unpaidLeaveDeductionEnabled: boolean;
  latePenaltyEnabled: boolean;
  maxGraceLateDaysPerMonth: number;
  lateDeductionPerDayRate: number; // fraction of daily rate
  roundingMethod: RoundingMethod;
  isDefault: boolean;
  isActive: boolean;
  effectiveFrom: Date;
  createdAt: Date;
  updatedAt: Date;
}

const payrollPolicySchema = new Schema<IPayrollPolicy>(
  {
    name: {
      type: String,
      required: [true, 'Policy name is required'],
      unique: true,
      trim: true,
    },
    workingDayDivisor: {
      type: Number,
      default: 30,
      min: [1, 'Divisor must be at least 1'],
    },
    useActualMonthDays: {
      type: Boolean,
      default: false,
    },
    absentDeductionEnabled: {
      type: Boolean,
      default: true,
    },
    halfDayDeductionRate: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1,
    },
    unpaidLeaveDeductionEnabled: {
      type: Boolean,
      default: true,
    },
    latePenaltyEnabled: {
      type: Boolean,
      default: false,
    },
    maxGraceLateDaysPerMonth: {
      type: Number,
      default: 3,
      min: 0,
    },
    lateDeductionPerDayRate: {
      type: Number,
      default: 0.25,
      min: 0,
    },
    roundingMethod: {
      type: String,
      enum: Object.values(RoundingMethods),
      default: RoundingMethods.ROUND,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const PayrollPolicy: Model<IPayrollPolicy> =
  mongoose.model<IPayrollPolicy>('PayrollPolicy', payrollPolicySchema);
