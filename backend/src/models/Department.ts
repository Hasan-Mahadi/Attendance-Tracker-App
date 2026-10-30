import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Department document interface.
 */
export interface IDepartment extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  managerId?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
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

export const Department: Model<IDepartment> = mongoose.model<IDepartment>(
  'Department',
  departmentSchema
);
