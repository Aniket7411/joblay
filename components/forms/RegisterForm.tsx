"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CheckCircle2, Eye, EyeOff, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useFetch } from "@/hooks/useFetch";
import { registerSchema, type RegisterFormData } from "@/lib/validations";
import type { Recruiter } from "@/types";

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const { execute, loading, error } = useFetch<Recruiter>();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    const result = await execute("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (result.success && result.data) {
      localStorage.setItem("joblay_recruiter", JSON.stringify(result.data));
      setSuccess(true);
      reset();
      setTimeout(() => router.push("/dashboard"), 1500);
    }
  };

  if (success) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle2 className="h-16 w-16 text-india-green mx-auto mb-4" />
        <h3 className="text-xl font-semibold">Account Created!</h3>
        <p className="text-muted-foreground mt-2">Redirecting to dashboard...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Input
          {...register("name")}
          label="Full Name"
          placeholder="Your name"
          autoComplete="name"
          error={errors.name?.message}
        />
        <Input
          {...register("company")}
          label="Company (optional)"
          placeholder="Company name"
          error={errors.company?.message}
        />
        <Input
          {...register("email")}
          type="email"
          label="Work Email"
          placeholder="you@company.com"
          autoComplete="email"
          error={errors.email?.message}
        />

        <div className="relative">
          <Input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            label="Password"
            placeholder="••••••••"
            autoComplete="new-password"
            hint="Min 8 chars with uppercase, lowercase, and a number"
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
          <UserPlus className="h-4 w-4" />
          Create Recruiter Account
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link href="/login" className="text-saffron font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </Card>
  );
}
