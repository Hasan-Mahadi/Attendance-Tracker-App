import mongoose, { Schema, Document, Model } from 'mongoose';
import { LeaveLedgerTypes, LeaveLedgerType } from '../config/constants.js';

export interface ILeaveLedgerEntry extends Document {
  _id: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  leaveCategory: mongoose.Types.ObjectId;
  leaveRequest?: mongoose.Types.ObjectId;
  year: number;
  type: LeaveLedgerType;
  amount: number; // Positive for additions/credits, negative for deductions/debits
  balanceAfter: number;
  description: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const leaveLedgerEntrySchema = new Schema<ILeaveLedgerEntry>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true,
    },
    leaveCategory: {
      type: Schema.Types.ObjectId,
      ref: 'LeaveCategory',
      required: [true, 'Leave category reference is required'],
      index: true,
    },
    leaveRequest: {
      type: Schema.Types.ObjectId,
      ref: 'LeaveRequest',
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(LeaveLedgerTypes),
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

leaveLedgerEntrySchema.index({ employee: 1, leaveCategory: 1, year: 1, createdAt: -1 });

export const LeaveLedgerEntry: Model<ILeaveLedgerEntry> =
  mongoose.model<ILeaveLedgerEntry>('LeaveLedgerEntry', leaveLedgerEntrySchema);
