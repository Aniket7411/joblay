"use client";

import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-saffron/10 text-saffron mx-auto mb-4">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold">Reset Password</h1>
        <p className="text-muted-foreground mt-2">
          Enter your email and we&apos;ll send a secure reset link.
        </p>
      </motion.div>
      <ForgotPasswordForm />
    </div>
  );
}
