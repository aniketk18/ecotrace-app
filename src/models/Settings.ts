import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  key: string;
  value: any;
  updatedBy: string;
  updatedAt: Date;
}

export interface IFormula {
  electricity: number;
  transport: number;
  food: number;
  threshold: number;
}

export interface ILLMConfig {
  apiKey: string;
  prompt: string;
  model: string;
}

const settingsSchema = new Schema<ISettings>(
  {
    key: { type: String, required: true, unique: true },
    value: Schema.Types.Mixed,
    updatedBy: { type: String, default: 'system' },
  },
  { timestamps: true }
);

export const Settings =
  mongoose.models.Settings || mongoose.model<ISettings>('Settings', settingsSchema);
