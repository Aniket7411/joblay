"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useFetch } from "@/hooks/useFetch";
import { loginSchema, type LoginFormData } from "@/lib/validations";
import type { Recruiter } from "@/types";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { execute, loading, error } = useFetch<Recruiter>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    const result = await execute("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (result.success && result.data) {
      router.push(result.data.role === "admin" ? "/admin" : "/dashboard");
      router.refresh();
    }
  };

  return (
    <Card className="p-6 sm:p-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Input
          {...register("email")}
          type="email"
          label="Email"
          placeholder="recruiter@company.com"
          autoComplete="email"
          error={errors.email?.message}
        />

        <div className="relative">
          <Input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            label="Password"
            placeholder="••••••••"
            autoComplete="current-password"
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

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-sm text-saffron hover:underline"
          >
            Forgot password?
          </Link>
        </div>

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
          <LogIn className="h-4 w-4" />
          Recruiter Sign In
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          New recruiter?{" "}
          <Link href="/register" className="text-saffron font-medium hover:underline">
            Create account
          </Link>
        </p>
      </form>
    </Card>
  );
}
