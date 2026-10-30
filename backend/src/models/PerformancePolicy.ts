import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPerformancePolicy extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  maxLateDays: number; // e.g. 2 late days permitted
  lateGraceMinutes: number; // e.g. 10
  minAttendancePercentage: number; // e.g. 90%
  minWorkingMinutesPerDay?: number;
  maxAbsentDays: number; // e.g. 0
  halfDayCountsAs: number; // e.g. 0.5 towards absence count
  bonusAmount: number; // in paisa (e.g. 200000 = ৳2,000.00)
  isDefault: boolean;
  isActive: boolean;
  effectiveFrom: Date;
  createdAt: Date;
  updatedAt: Date;
}

const performancePolicySchema = new Schema<IPerformancePolicy>(
  {
    name: {
      type: String,
      required: [true, 'Policy name is required'],
      unique: true,
      trim: true,
    },
    maxLateDays: {
      type: Number,
      default: 2,
      min: 0,
    },
    lateGraceMinutes: {
      type: Number,
      default: 10,
      min: 0,
    },
    minAttendancePercentage: {
      type: Number,
      default: 90,
      min: 0,
      max: 100,
    },
    minWorkingMinutesPerDay: {
      type: Number,
      min: 0,
    },
    maxAbsentDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    halfDayCountsAs: {
      type: Number,
      default: 0.5,
      min: 0,
    },
    bonusAmount: {
      type: Number,
      default: 0,
      min: 0,
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

type IPeformancePolicy = IPerformancePolicy;

export const PerformancePolicy: Model<IPerformancePolicy> =
  mongoose.model<IPerformancePolicy>('PerformancePolicy', performancePolicySchema);
