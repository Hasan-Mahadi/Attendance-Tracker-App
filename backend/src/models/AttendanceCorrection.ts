import mongoose, { Schema, Document, Model } from 'mongoose';
import { CorrectionStatuses, CorrectionStatus } from '../config/constants.js';

export interface IAttendanceCorrection extends Document {
  _id: mongoose.Types.ObjectId;
  attendanceRecord: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  previousData: Record<string, unknown>;
  correctedData: Record<string, unknown>;
  reason: string;
  status: CorrectionStatus;
  requestedBy: mongoose.Types.ObjectId;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceCorrectionSchema = new Schema<IAttendanceCorrection>(
  {
    attendanceRecord: {
      type: Schema.Types.ObjectId,
      ref: 'AttendanceRecord',
      required: [true, 'Attendance record reference is required'],
      index: true,
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true,
    },
    previousData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    correctedData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    reason: {
      type: String,
      required: [true, 'Correction reason is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(CorrectionStatuses),
      default: CorrectionStatuses.PENDING,
      index: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
  },
  {
    timestamps: true,
  }
);

export const AttendanceCorrection: Model<IAttendanceCorrection> =
  mongoose.model<IAttendanceCorrection>('AttendanceCorrection', attendanceCorrectionSchema);
