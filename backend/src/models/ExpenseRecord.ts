import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  PaymentMethods,
  PaymentMethod,
  ExpenseApprovalStatuses,
  ExpenseApprovalStatus,
} from '../config/constants.js';

export interface IExpenseRecord extends Document {
  _id: mongoose.Types.ObjectId;
  date: Date;
  category: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  amount: number; // in paisa (e.g. 150000 = ৳1,500.00)
  paymentMethod: PaymentMethod;
  vendor?: string;
  receiptUrl?: string;
  enteredBy: mongoose.Types.ObjectId;
  approvalStatus: ExpenseApprovalStatus;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const expenseRecordSchema = new Schema<IExpenseRecord>(
  {
    date: {
      type: Date,
      required: [true, 'Expense date is required'],
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'ExpenseCategory',
      required: [true, 'Expense category is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [1, 'Amount must be at least 1 paisa'],
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethods),
      default: PaymentMethods.CASH,
      required: true,
    },
    vendor: {
      type: String,
      trim: true,
    },
    receiptUrl: {
      type: String,
      trim: true,
    },
    enteredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: Object.values(ExpenseApprovalStatuses),
      default: ExpenseApprovalStatuses.PENDING,
      index: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

expenseRecordSchema.index({ date: -1, category: 1 });
expenseRecordSchema.index({ approvalStatus: 1, date: -1 });

export const ExpenseRecord: Model<IExpenseRecord> =
  mongoose.model<IExpenseRecord>('ExpenseRecord', expenseRecordSchema);
