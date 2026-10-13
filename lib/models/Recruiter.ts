import mongoose, { Schema, type Model } from "mongoose";
import type { Recruiter } from "@/types";

export interface RecruiterDocument extends Omit<Recruiter, "id">, mongoose.Document {
  passwordHash: string;
  resetTokenHash?: string;
  resetTokenExpires?: Date;
}

const recruiterSchema = new Schema<RecruiterDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    company: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    resetTokenHash: { type: String, index: true, sparse: true },
    resetTokenExpires: { type: Date },
  },
  { timestamps: true }
);

export const RecruiterModel: Model<RecruiterDocument> =
  mongoose.models.Recruiter ??
  mongoose.model<RecruiterDocument>("Recruiter", recruiterSchema);
