import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  PerformanceEvaluationStatuses,
  PerformanceEvaluationStatus,
} from '../config/constants.js';

export interface IPerformanceEvaluation extends Document {
  _id: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  month: number;
  year: number;
  workingDays: number;
  daysPresent: number;
  lateDays: number;
  totalLateMinutes: number;
  absentDays: number;
  halfDays: number;
  attendancePercentage: number;
  averageWorkingMinutes: number;
  isEligible: boolean;
  ineligibilityReasons: string[];
  bonusAmount: number; // in paisa
  status: PerformanceEvaluationStatus;
  policySnapshot?: Record<string, unknown>;
  evaluatedBy?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const performanceEvaluationSchema = new Schema<IPerformanceEvaluation>(
  {
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
    workingDays: {
      type: Number,
      default: 0,
    },
    daysPresent: {
      type: Number,
      default: 0,
    },
    lateDays: {
      type: Number,
      default: 0,
    },
    totalLateMinutes: {
      type: Number,
      default: 0,
    },
    absentDays: {
      type: Number,
      default: 0,
    },
    halfDays: {
      type: Number,
      default: 0,
    },
    attendancePercentage: {
      type: Number,
      default: 0,
    },
    averageWorkingMinutes: {
      type: Number,
      default: 0,
    },
    isEligible: {
      type: Boolean,
      default: false,
    },
    ineligibilityReasons: {
      type: [String],
      default: [],
    },
    bonusAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(PerformanceEvaluationStatuses),
      default: PerformanceEvaluationStatuses.DRAFT,
      index: true,
    },
    policySnapshot: {
      type: Schema.Types.Mixed,
    },
    evaluatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

performanceEvaluationSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

export const PerformanceEvaluation: Model<IPerformanceEvaluation> =
  mongoose.model<IPerformanceEvaluation>(
    'PerformanceEvaluation',
    performanceEvaluationSchema
  );
