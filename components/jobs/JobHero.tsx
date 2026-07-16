"use client";

import { motion } from "framer-motion";
import { Briefcase } from "lucide-react";

export function JobHero() {
  return (
    <section className="relative border-b border-border">
      <div className="absolute inset-0 bg-gradient-to-br from-saffron/5 via-background to-india-green/5" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-saffron/30 bg-saffron/10 px-4 py-1.5 text-sm font-medium text-saffron-dark dark:text-saffron mb-6">
            <Briefcase className="h-3.5 w-3.5" />
            Open roles across India
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
            Find your next role.{" "}
            <span className="bg-gradient-to-r from-saffron to-saffron-dark bg-clip-text text-transparent">
              Reach out directly.
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl">
            Whatever necessary or logical or required — browse open positions,
            filter by location, profile, and industry, then contact recruiters
            instantly. No sign-up. No middle layer.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
