"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CheckCircle2, Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useFetch } from "@/hooks/useFetch";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/lib/validations";

function ResetPasswordFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const { execute, loading, error } = useFetch();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    const result = await execute("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (result.success) {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    }
  };

  if (!token) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Invalid reset link.</p>
        <Link href="/forgot-password">
          <Button variant="outline" className="mt-4">
            Request new link
          </Button>
        </Link>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle2 className="h-16 w-16 text-india-green mx-auto mb-4" />
        <h3 className="text-xl font-semibold">Password Updated</h3>
        <p className="text-muted-foreground mt-2">Redirecting to sign in...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <input type="hidden" {...register("token")} />

        <div className="relative">
          <Input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            label="New Password"
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.password?.message}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        <Input
          {...register("confirmPassword")}
          type="password"
          label="Confirm Password"
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
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
          <KeyRound className="h-4 w-4" />
          Reset Password
        </Button>
      </form>
    </Card>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense fallback={<Card className="p-8 animate-pulse h-64" />}>
      <ResetPasswordFormInner />
    </Suspense>
  );
}
