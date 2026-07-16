"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  Home,
  LayoutDashboard,
  LogIn,
  Menu,
  Moon,
  Plus,
  Sun,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/Button";
import { useMounted } from "@/hooks/useMounted";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Jobs", icon: Home },
  { href: "/login", label: "Recruiter", icon: Briefcase },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-saffron to-saffron-dark text-white font-bold text-lg shadow-lg shadow-saffron/30 transition-transform group-hover:scale-105">
            भ
          </div>
          <span className="text-xl font-bold tracking-tight">
            Bharat<span className="text-saffron"> Jobs</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === href
                  ? "text-saffron bg-saffron/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {label}
            </Link>
          ))}
          <Link href="/dashboard">
            <span
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith("/dashboard")
                  ? "text-saffron bg-saffron/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              Dashboard
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          )}

          <Link href="/login" className="hidden sm:block">
            <Button variant="ghost" size="sm">
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          </Link>

          <Link href="/dashboard/post" className="hidden sm:block">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Post Job
            </Button>
          </Link>

          <button
            onClick={() => setOpen(!open)}
            className="flex md:hidden h-10 w-10 items-center justify-center rounded-xl border border-border"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border overflow-hidden"
          >
            <div className="flex flex-col gap-1 p-4">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                <Home className="h-4 w-4" />
                Jobs
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full mt-2">
                  Recruiter Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
