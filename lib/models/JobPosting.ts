import mongoose, { Schema, type Model } from "mongoose";
import type { JobPosting, RecruiterContact } from "@/types";

export interface JobPostingDocument
  extends Omit<JobPosting, "id" | "createdAt" | "recruiterId">,
    mongoose.Document {
  recruiterId: mongoose.Types.ObjectId;
}

const contactSchema = new Schema<RecruiterContact>(
  {
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
  },
  { _id: false }
);

const jobPostingSchema = new Schema<JobPostingDocument>(
  {
    recruiterId: {
      type: Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, index: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, required: true, index: true },
    jobProfile: { type: String, required: true, index: true },
    industry: { type: String, required: true, index: true },
    subRole: { type: String, required: true, index: true },
    tags: { type: [String], required: true, index: true },
    description: { type: String, required: true },
    criteria: { type: [String], required: true },
    attachmentUrl: { type: String, trim: true },
    contact: {
      type: contactSchema,
      required: true,
      validate: {
        validator(contact: RecruiterContact) {
          return Boolean(contact?.name || contact?.email || contact?.phone);
        },
        message: "At least one contact field (name, email, or phone) is required",
      },
    },
  },
  { timestamps: true }
);

jobPostingSchema.index({ industry: 1, subRole: 1, tags: 1 });
jobPostingSchema.index({ location: 1, jobProfile: 1, industry: 1 });
jobPostingSchema.index({ createdAt: -1 });

export const JobPostingModel: Model<JobPostingDocument> =
  mongoose.models.JobPosting ??
  mongoose.model<JobPostingDocument>("JobPosting", jobPostingSchema);
