import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Employee invitation document interface.
 */
export interface IEmployeeInvitation extends Document {
  _id: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  invitationCode: string;
  email: string;
  createdBy: mongoose.Types.ObjectId;
  expiresAt: Date;
  isUsed: boolean;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const employeeInvitationSchema = new Schema<IEmployeeInvitation>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
    },
    invitationCode: {
      type: String,
      required: [true, 'Invitation code is required'],
      unique: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required'],
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index - automatically delete expired invitations
employeeInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const EmployeeInvitation: Model<IEmployeeInvitation> =
  mongoose.model<IEmployeeInvitation>(
    'EmployeeInvitation',
    employeeInvitationSchema
  );
