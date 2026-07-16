"use client";

import { motion } from "framer-motion";
import { KeyRound } from "lucide-react";
import { ResetPasswordForm } from "@/components/forms/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-saffron/10 text-saffron mx-auto mb-4">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold">New Password</h1>
        <p className="text-muted-foreground mt-2">
          Choose a strong password for your recruiter account.
        </p>
      </motion.div>
      <ResetPasswordForm />
    </div>
  );
}
