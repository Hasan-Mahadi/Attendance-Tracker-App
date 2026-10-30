import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHoliday extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  date: Date;
  year: number;
  isRecurring: boolean;
  departments: mongoose.Types.ObjectId[]; // Empty array means all departments
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const holidaySchema = new Schema<IHoliday>(
  {
    name: {
      type: String,
      required: [true, 'Holiday name is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Holiday date is required'],
      index: true,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    departments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Department',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

holidaySchema.index({ date: 1, name: 1 }, { unique: true });

export const Holiday: Model<IHoliday> = mongoose.model<IHoliday>('Holiday', holidaySchema);
