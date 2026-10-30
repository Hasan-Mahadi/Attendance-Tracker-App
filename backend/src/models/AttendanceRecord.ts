import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  AttendanceStatuses,
  AttendanceStatus,
  ApprovalStatuses,
  ApprovalStatus,
} from '../config/constants.js';

/**
 * Attendance record document interface.
 */
export interface IAttendanceRecord extends Document {
  _id: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  date: Date; // Normalized to UTC start of day
  scheduledStartTime?: Date;
  scheduledEndTime?: Date;
  actualCheckInTime?: Date;
  actualCheckOutTime?: Date;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  lunchOutTime?: Date;
  lunchInTime?: Date;
  lunchDurationMinutes: number;
  grossMinutes: number;
  breakMinutes: number;
  netWorkingMinutes: number;
  status: AttendanceStatus;
  approvalStatus: ApprovalStatus;
  isManualEntry: boolean;
  correctionReason?: string;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Attendance date is required'],
      index: true,
    },
    scheduledStartTime: {
      type: Date,
    },
    scheduledEndTime: {
      type: Date,
    },
    actualCheckInTime: {
      type: Date,
    },
    actualCheckOutTime: {
      type: Date,
    },
    lateMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    earlyDepartureMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    lunchOutTime: {
      type: Date,
    },
    lunchInTime: {
      type: Date,
    },
    lunchDurationMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    grossMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    breakMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    netWorkingMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(AttendanceStatuses),
      default: AttendanceStatuses.IN_PROGRESS,
      required: true,
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: Object.values(ApprovalStatuses),
      default: ApprovalStatuses.AUTO_APPROVED,
      required: true,
    },
    isManualEntry: {
      type: Boolean,
      default: false,
    },
    correctionReason: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure 1 record per employee per date
attendanceRecordSchema.index({ employee: 1, date: 1 }, { unique: true });
// Compound index for date range queries by employee
attendanceRecordSchema.index({ employee: 1, date: 1, status: 1 });
// Index for daily/monthly company attendance queries
attendanceRecordSchema.index({ date: 1, status: 1 });

export const AttendanceRecord: Model<IAttendanceRecord> =
  mongoose.model<IAttendanceRecord>('AttendanceRecord', attendanceRecordSchema);
