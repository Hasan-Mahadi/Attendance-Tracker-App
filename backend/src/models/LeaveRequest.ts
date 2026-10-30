import mongoose, { Schema, Document, Model } from 'mongoose';
import { LeaveStatuses, LeaveStatus } from '../config/constants.js';

export interface ILeaveRequest extends Document {
  _id: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  leaveCategory: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  isHalfDay: boolean;
  halfDayDate?: Date;
  reason: string;
  status: LeaveStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const leaveRequestSchema = new Schema<ILeaveRequest>(
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
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    totalDays: {
      type: Number,
      required: [true, 'Total days is required'],
      min: 0.5,
    },
    isHalfDay: {
      type: Boolean,
      default: false,
    },
    halfDayDate: {
      type: Date,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(LeaveStatuses),
      default: LeaveStatuses.PENDING,
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
      trim: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

leaveRequestSchema.index({ employee: 1, status: 1, startDate: -1 });
leaveRequestSchema.index({ status: 1, startDate: 1 });

export const LeaveRequest: Model<ILeaveRequest> =
  mongoose.model<ILeaveRequest>('LeaveRequest', leaveRequestSchema);
