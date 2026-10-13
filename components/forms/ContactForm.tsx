"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Turnstile } from "@/components/ui/Turnstile";
import { useFetch } from "@/hooks/useFetch";
import {
  contactSchema,
  contactTopics,
  type ContactFormData,
} from "@/lib/validations";
import { cn } from "@/lib/utils";

type Topic = ContactFormData["topic"];

export function ContactForm({
  initialTopic,
  initialMessage = "",
}: {
  initialTopic: Topic;
  initialMessage?: string;
}) {
  const [sent, setSent] = useState(false);
  const { execute, loading, error } = useFetch();
  // Bot check token (only when Turnstile is configured); single-use.
  const [captcha, setCaptcha] = useState("");
  const [captchaReset, setCaptchaReset] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { topic: initialTopic, message: initialMessage },
  });

  const topic = watch("topic");

  const onSubmit = async (data: ContactFormData) => {
    const result = await execute("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, turnstileToken: captcha }),
    });
    setCaptchaReset((n) => n + 1);
    if (result.success) setSent(true);
  };

  if (sent) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle2 className="h-16 w-16 text-india-green mx-auto mb-4" />
        <h3 className="text-xl font-semibold">Message sent</h3>
        <p className="text-muted-foreground mt-2 text-sm">
          Thanks for getting in touch. We&apos;ll reply to your email as soon as
          we can.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            {...register("name")}
            label="Your name"
            autoComplete="name"
            error={errors.name?.message}
          />
          <Input
            {...register("email")}
            type="email"
            label="Email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="topic" className="block text-sm font-medium">
            Topic
          </label>
          <select
            id="topic"
            {...register("topic")}
            className={cn(
              "w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm transition-colors",
              "hover:border-saffron/40 focus:outline-none focus:ring-2 focus:ring-saffron/50 focus:border-saffron"
            )}
          >
            {contactTopics.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <Textarea
          {...register("message")}
          label="Message"
          placeholder={
            topic === "report"
              ? "Job title, company name, and what looked wrong (e.g. they asked for a fee)"
              : "How can we help?"
          }
          error={errors.message?.message}
        />

        {/* Honeypot — hidden from people, filled by bots */}
        <input
          {...register("website")}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
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

        <Turnstile onToken={setCaptcha} resetSignal={captchaReset} />

        <Button type="submit" loading={loading} className="w-full sm:w-auto">
          <Send className="h-4 w-4" />
          Send message
        </Button>
      </form>
    </Card>
  );
}
