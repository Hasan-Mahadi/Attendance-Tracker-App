import mongoose, { Schema, Document, Model } from 'mongoose';
import { PayrollAdjustmentTypes, PayrollAdjustmentType } from '../config/constants.js';

export interface IPayrollAdjustment extends Document {
  _id: mongoose.Types.ObjectId;
  payrollRecord?: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  month: number;
  year: number;
  type: PayrollAdjustmentType;
  amount: number; // in paisa
  reason: string;
  createdBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const payrollAdjustmentSchema = new Schema<IPayrollAdjustment>(
  {
    payrollRecord: {
      type: Schema.Types.ObjectId,
      ref: 'PayrollRecord',
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
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
    type: {
      type: String,
      enum: Object.values(PayrollAdjustmentTypes),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

payrollAdjustmentSchema.index({ employee: 1, year: 1, month: 1 });

export const PayrollAdjustment: Model<IPayrollAdjustment> =
  mongoose.model<IPayrollAdjustment>('PayrollAdjustment', payrollAdjustmentSchema);
