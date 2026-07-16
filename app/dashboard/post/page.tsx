"use client";

import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { JobPostForm } from "@/components/forms/JobPostForm";

export default function PostJobPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-saffron/10 text-saffron">
            <FileText className="h-5 w-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Post a Job</h1>
        </div>
        <p className="text-muted-foreground">
          Add a new job description. Candidates will contact you directly.
        </p>
      </motion.div>
      <JobPostForm />
    </div>
  );
}
