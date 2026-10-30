import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Attendance policy document interface.
 */
export interface IAttendancePolicy extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  lateGraceMinutes: number;
  halfDayThresholdMinutes: number; // minimum minutes worked to qualify for half day (e.g. 240 = 4h)
  minimumWorkingMinutes: number; // minimum minutes worked for a full day (e.g. 480 = 8h)
  earlyDepartureThresholdMinutes: number; // minutes before scheduled end that trigger early departure
  requireCheckout: boolean;
  allowAdminCorrection: boolean;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const attendancePolicySchema = new Schema<IAttendancePolicy>(
  {
    name: {
      type: String,
      required: [true, 'Policy name is required'],
      unique: true,
      trim: true,
    },
    lateGraceMinutes: {
      type: Number,
      default: 10,
      min: [0, 'Grace period cannot be negative'],
    },
    halfDayThresholdMinutes: {
      type: Number,
      default: 240, // 4 hours
      min: [60, 'Half day threshold must be at least 60 minutes'],
    },
    minimumWorkingMinutes: {
      type: Number,
      default: 480, // 8 hours
      min: [120, 'Minimum working minutes must be at least 120 minutes'],
    },
    earlyDepartureThresholdMinutes: {
      type: Number,
      default: 15,
      min: [0, 'Early departure threshold cannot be negative'],
    },
    requireCheckout: {
      type: Boolean,
      default: true,
    },
    allowAdminCorrection: {
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
    },
  },
  {
    timestamps: true,
  }
);

export const AttendancePolicy: Model<IAttendancePolicy> =
  mongoose.model<IAttendancePolicy>('AttendancePolicy', attendancePolicySchema);
