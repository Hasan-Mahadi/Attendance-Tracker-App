import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILeaveBalance extends Document {
  _id: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  leaveCategory: mongoose.Types.ObjectId;
  year: number;
  allocated: number;
  used: number;
  pending: number;
  carriedForward: number;
  balance: number; // allocated + carriedForward - used - pending
  createdAt: Date;
  updatedAt: Date;
}

const leaveBalanceSchema = new Schema<ILeaveBalance>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true,
    },
    leaveCategory: {
      type: Schema.Types.ObjectId,
      ref: 'LeaveCategory',
      required: [true, 'Leave category reference is required'],
      index: true,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      index: true,
    },
    allocated: {
      type: Number,
      default: 0,
      min: 0,
    },
    used: {
      type: Number,
      default: 0,
      min: 0,
    },
    pending: {
      type: Number,
      default: 0,
      min: 0,
    },
    carriedForward: {
      type: Number,
      default: 0,
      min: 0,
    },
    balance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

leaveBalanceSchema.index({ employee: 1, leaveCategory: 1, year: 1 }, { unique: true });

export const LeaveBalance: Model<ILeaveBalance> =
  mongoose.model<ILeaveBalance>('LeaveBalance', leaveBalanceSchema);
