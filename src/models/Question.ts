import mongoose, { Schema, Document } from 'mongoose';

export interface IOption {
  emoji: string;
  label: string;
  weight: number;
}

export interface IQuestion extends Document {
  id: string;
  category: 'energy' | 'transport' | 'food' | 'waste' | 'custom';
  icon: string;
  order: number;
  formula?: string;
  text: string;        // primary field
  question?: string;   // legacy alias
  options: IOption[];
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    id: { type: String, required: true, unique: true },
    category: {
      type: String,
      enum: ['energy', 'transport', 'food', 'waste', 'custom'],
      required: true,
    },
    icon: { type: String, default: '❓' },
    order: { type: Number, default: 0 },
    formula: { type: String },
    text: { type: String },
    question: { type: String }, // legacy
    options: [
      {
        emoji: String,
        label: String,
        weight: Number,
      },
    ],
  },
  { timestamps: true }
);

export const Question =
  mongoose.models.Question || mongoose.model<IQuestion>('Question', questionSchema);
