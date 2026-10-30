import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILeavePolicy extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  leaveCategory: mongoose.Types.ObjectId;
  annualAllocation: number;
  monthlyAccrual: number;
  maxCarryForward: number;
  allowHalfDay: boolean;
  minNoticeDays: number;
  maxConsecutiveDays?: number;
  minEmploymentDays: number;
  affectsSalary: boolean; // true for unpaid leave
  expiresAnnually: boolean;
  requiresApproval: boolean;
  isDefault: boolean;
  isActive: boolean;
  effectiveFrom: Date;
  createdAt: Date;
  updatedAt: Date;
}

const leavePolicySchema = new Schema<ILeavePolicy>(
  {
    name: {
      type: String,
      required: [true, 'Policy name is required'],
      trim: true,
    },
    leaveCategory: {
      type: Schema.Types.ObjectId,
      ref: 'LeaveCategory',
      required: [true, 'Leave category reference is required'],
      index: true,
    },
    annualAllocation: {
      type: Number,
      required: [true, 'Annual allocation is required'],
      min: 0,
    },
    monthlyAccrual: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxCarryForward: {
      type: Number,
      default: 0,
      min: 0,
    },
    allowHalfDay: {
      type: Boolean,
      default: true,
    },
    minNoticeDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxConsecutiveDays: {
      type: Number,
      min: 1,
    },
    minEmploymentDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    affectsSalary: {
      type: Boolean,
      default: false,
    },
    expiresAnnually: {
      type: Boolean,
      default: true,
    },
    requiresApproval: {
      type: Boolean,
      default: true,
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

leavePolicySchema.index({ name: 1, leaveCategory: 1 }, { unique: true });

export const LeavePolicy: Model<ILeavePolicy> =
  mongoose.model<ILeavePolicy>('LeavePolicy', leavePolicySchema);
