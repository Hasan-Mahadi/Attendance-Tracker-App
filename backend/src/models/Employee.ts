import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  EmploymentTypes,
  EmploymentType,
  EmploymentStatuses,
  EmploymentStatus,
} from '../config/constants.js';

/**
 * Employee document interface.
 */
export interface IEmployee extends Document {
  _id: mongoose.Types.ObjectId;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImage?: string;
  department: mongoose.Types.ObjectId;
  designation?: string;
  joiningDate: Date;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  reportingManager?: mongoose.Types.ObjectId;
  workSchedule?: mongoose.Types.ObjectId;
  attendancePolicy?: mongoose.Types.ObjectId;
  leavePolicy?: mongoose.Types.ObjectId;
  performancePolicy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>(
  {
    employeeCode: {
      type: String,
      required: [true, 'Employee code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    designation: {
      type: String,
      trim: true,
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
    },
    employmentType: {
      type: String,
      enum: Object.values(EmploymentTypes),
      default: EmploymentTypes.FULL_TIME,
      required: true,
    },
    employmentStatus: {
      type: String,
      enum: Object.values(EmploymentStatuses),
      default: EmploymentStatuses.ACTIVE,
      required: true,
    },
    reportingManager: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    workSchedule: {
      type: Schema.Types.ObjectId,
      ref: 'WorkSchedule',
    },
    attendancePolicy: {
      type: Schema.Types.ObjectId,
      ref: 'AttendancePolicy',
    },
    leavePolicy: {
      type: Schema.Types.ObjectId,
      ref: 'LeavePolicy',
    },
    performancePolicy: {
      type: Schema.Types.ObjectId,
      ref: 'PerformancePolicy',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
employeeSchema.index({ department: 1 });
employeeSchema.index({ employmentStatus: 1 });
employeeSchema.index({ joiningDate: 1 });

export const Employee: Model<IEmployee> = mongoose.model<IEmployee>(
  'Employee',
  employeeSchema
);
