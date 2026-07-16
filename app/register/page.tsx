"use client";

import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import { RegisterForm } from "@/components/forms/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-india-green to-india-green-dark text-white mx-auto mb-4 shadow-lg shadow-india-green/30">
          <UserPlus className="h-6 w-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold">Recruiter Registration</h1>
        <p className="text-muted-foreground mt-2">
          Post jobs and let candidates reach you directly.
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <RegisterForm />
      </motion.div>
    </div>
  );
}
