import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILeaveCategory extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  isPaid: boolean;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const leaveCategorySchema = new Schema<ILeaveCategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Category code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isPaid: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const LeaveCategory: Model<ILeaveCategory> =
  mongoose.model<ILeaveCategory>('LeaveCategory', leaveCategorySchema);
