import mongoose, { Schema, Document, Model } from 'mongoose';
import { DEFAULT_TIMEZONE, DEFAULT_CURRENCY, DEFAULT_CURRENCY_SYMBOL } from '../config/constants.js';

export interface ICompanySettings extends Document {
  _id: mongoose.Types.ObjectId;
  companyName: string;
  logoUrl?: string;
  timezone: string;
  currency: string;
  currencySymbol: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  website?: string;
  workweek: number[]; // e.g. [0, 1, 2, 3, 4] for Sunday to Thursday
  fiscalYearStartMonth: number; // 1-12
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const companySettingsSchema = new Schema<ICompanySettings>(
  {
    companyName: {
      type: String,
      default: 'AIExpertsBD',
      required: true,
      trim: true,
    },
    logoUrl: {
      type: String,
    },
    timezone: {
      type: String,
      default: DEFAULT_TIMEZONE,
      required: true,
    },
    currency: {
      type: String,
      default: DEFAULT_CURRENCY,
      required: true,
    },
    currencySymbol: {
      type: String,
      default: DEFAULT_CURRENCY_SYMBOL,
      required: true,
    },
    contactEmail: {
      type: String,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    workweek: {
      type: [Number],
      default: [0, 1, 2, 3, 4], // Sun-Thu (standard BD workweek)
    },
    fiscalYearStartMonth: {
      type: Number,
      default: 1, // January
      min: 1,
      max: 12,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const CompanySettings: Model<ICompanySettings> =
  mongoose.model<ICompanySettings>('CompanySettings', companySettingsSchema);
