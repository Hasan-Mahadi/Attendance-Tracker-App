import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Work schedule document interface.
 */
export interface IWorkSchedule extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  startTime: string;
  endTime: string;
  workingDays: number[];
  lunchStartTime?: string;
  lunchEndTime?: string;
  lunchDurationMinutes?: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const workScheduleSchema = new Schema<IWorkSchedule>(
  {
    name: {
      type: String,
      required: [true, 'Schedule name is required'],
      unique: true,
      trim: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm format'],
    },
    workingDays: {
      type: [Number],
      required: [true, 'Working days are required'],
      validate: {
        validator: function (days: number[]) {
          return (
            days.length > 0 &&
            days.every((d) => d >= 0 && d <= 6)
          );
        },
        message: 'Working days must be numbers between 0 (Sunday) and 6 (Saturday)',
      },
    },
    lunchStartTime: {
      type: String,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Lunch start time must be in HH:mm format'],
    },
    lunchEndTime: {
      type: String,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Lunch end time must be in HH:mm format'],
    },
    lunchDurationMinutes: {
      type: Number,
      min: 0,
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

export const WorkSchedule: Model<IWorkSchedule> = mongoose.model<IWorkSchedule>(
  'WorkSchedule',
  workScheduleSchema
);
