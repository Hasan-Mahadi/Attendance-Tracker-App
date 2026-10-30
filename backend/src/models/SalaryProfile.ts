import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISalaryProfile extends Document {
  _id: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  baseSalary: number; // in integer paisa (e.g. 2000000 = ৳20,000.00)
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const salaryProfileSchema = new Schema<ISalaryProfile>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true,
    },
    baseSalary: {
      type: Number,
      required: [true, 'Base salary is required'],
      min: [0, 'Base salary must be non-negative'],
    },
    effectiveFrom: {
      type: Date,
      required: [true, 'Effective from date is required'],
      index: true,
    },
    effectiveTo: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
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

salaryProfileSchema.index({ employee: 1, effectiveFrom: -1 });

export const SalaryProfile: Model<ISalaryProfile> =
  mongoose.model<ISalaryProfile>('SalaryProfile', salaryProfileSchema);
