import mongoose, { Schema, Document } from 'mongoose';

export interface ICategoryData {
  co2: number;
  pct: number;
}

export interface IResponse extends Document {
  userId?: string;
  userName: string;
  empId: string;
  dept?: string;
  answers?: Record<string, string | number>;
  answerLabels?: Record<string, string>;
  answerWeights?: Record<string, number>;
  questions?: { id: string; text: string }[];
  earths: number;
  totalCO2: number;
  catData: {
    energy?: ICategoryData;
    transport?: ICategoryData;
    food?: ICategoryData;
    waste?: ICategoryData;
  };
  aiReport?: string;
  timestamp?: number;
  date?: string;
  createdAt: Date;
  updatedAt: Date;
}

const responseSchema = new Schema<IResponse>(
  {
    userId: { type: String },
    userName: { type: String, required: true },
    empId: { type: String, required: true },
    dept: { type: String, default: 'N/A' },
    // Store as Mixed (plain objects) for easy admin viewing
    answers: { type: Schema.Types.Mixed },
    answerLabels: { type: Schema.Types.Mixed },
    answerWeights: { type: Schema.Types.Mixed },
    questions: [{ id: String, text: String }],
    earths: { type: Number, required: true },
    totalCO2: { type: Number, required: true },
    catData: { type: Schema.Types.Mixed },
    aiReport: String,
    timestamp: Number,
    date: String,
  },
  { timestamps: true }
);

export const Response =
  mongoose.models.Response || mongoose.model<IResponse>('Response', responseSchema);
