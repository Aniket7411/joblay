"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useFetch } from "@/hooks/useFetch";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/lib/validations";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const { execute, loading, error } = useFetch();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    const result = await execute("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (result.success) setSent(true);
  };

  if (sent) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle2 className="h-16 w-16 text-india-green mx-auto mb-4" />
        <h3 className="text-xl font-semibold">Check your email</h3>
        <p className="text-muted-foreground mt-2 text-sm">
          If an account exists for that email, we&apos;ve sent a reset link.
          It expires in 1 hour — check your spam folder if you don&apos;t see it.
        </p>
        <Link href="/login">
          <Button variant="outline" className="mt-6">
            Back to Sign In
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Input
          {...register("email")}
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
        />

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-red-500"
            role="alert"
          >
            {error}
          </motion.p>
        )}

        <Button type="submit" loading={loading} className="w-full">
          <Mail className="h-4 w-4" />
          Send Reset Link
        </Button>

        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Sign In
        </Link>
      </form>
    </Card>
  );
}
