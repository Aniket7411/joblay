"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Turnstile } from "@/components/ui/Turnstile";
import { locations } from "@/lib/data/filterHierarchy";
import type { BulkHiringPopup as PopupSettings } from "@/types";

/**
 * Bulk hiring enquiry popup. Appears only while an admin has it switched on
 * (Admin → Popup), after a short delay, on public pages. Closing it hides it
 * for 3 days; sending an enquiry hides it for 30. Editing the popup in the
 * admin panel shows it again to everyone.
 */
const DISMISS_KEY = "joblay-bulk-popup";
const HIDE_AFTER_CLOSE_MS = 3 * 86_400_000;
const HIDE_AFTER_SEND_MS = 30 * 86_400_000;
// Pages where the popup would get in the way.
const SKIP = ["/admin", "/dashboard", "/login", "/register", "/forgot-password", "/reset-password", "/contact"];

const hiresOptions = ["5-20", "20-50", "50-200", "200+"];

function hiddenUntil(version: string): number {
  try {
    const saved = JSON.parse(localStorage.getItem(DISMISS_KEY) ?? "null") as { v: string; until: number } | null;
    return saved?.v === version ? saved.until : 0;
  } catch {
    return 0;
  }
}

function hideFor(version: string, ms: number) {
  try {
    localStorage.setItem(DISMISS_KEY, JSON.stringify({ v: version, until: Date.now() + ms }));
  } catch {
    // storage blocked: it may show again next visit
  }
}

export function BulkHiringPopup() {
  const pathname = usePathname();
  const skip = SKIP.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const [popup, setPopup] = useState<PopupSettings | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (skip || popup) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    fetch("/api/popup")
      .then((r) => r.json())
      .then((json) => {
        const p = json?.data as PopupSettings | undefined;
        if (cancelled || !p?.enabled) return;
        const version = p.updatedAt ?? "";
        if (hiddenUntil(version) > Date.now()) return;
        setPopup(p);
        timer = setTimeout(() => !cancelled && setOpen(true), p.delaySeconds * 1000);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [skip, popup]);

  if (!popup || skip) return null;
  const version = popup.updatedAt ?? "";
  return (
    <BulkHiringModal
      popup={popup}
      open={open}
      onClose={(sent) => {
        hideFor(version, sent ? HIDE_AFTER_SEND_MS : HIDE_AFTER_CLOSE_MS);
        setOpen(false);
      }}
    />
  );
}

/** The modal itself; also used by the admin panel's preview (preview = no sending). */
export function BulkHiringModal({
  popup,
  open,
  onClose,
  preview = false,
}: {
  popup: Pick<PopupSettings, "title" | "message">;
  open: boolean;
  onClose: (sent: boolean) => void;
  preview?: boolean;
}) {
  const [form, setForm] = useState({ name: "", company: "", phone: "", email: "", hires: "", city: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaReset, setCaptchaReset] = useState(0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose(sent);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, sent]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Please enter your name";
    if (form.company.trim().length < 2) next.company = "Please enter the company name";
    if (form.phone.replace(/\D/g, "").length < 10) next.phone = "Enter a valid phone number";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Enter a valid email";
    if (!form.hires) next.hires = "Choose how many people";
    setErrors(next);
    if (Object.keys(next).length || preview) return;

    setSending(true);
    setServerError("");
    const message = [
      `Company: ${form.company.trim()}`,
      `Phone: ${form.phone.trim()}`,
      `People to hire: ${form.hires}`,
      form.city && `City: ${form.city}`,
      form.notes.trim() && `\n${form.notes.trim()}`,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          topic: "bulk",
          message,
          turnstileToken: captcha,
        }),
      });
      const json = await res.json();
      if (json.success) setSent(true);
      else setServerError(json.message || "Couldn't send. Please try again.");
    } catch {
      setServerError("Couldn't send. Please check your connection and try again.");
    } finally {
      setSending(false);
      setCaptchaReset((n) => n + 1);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="bulk-title">
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onClose(sent)}
          />
          <motion.div
            className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-background shadow-2xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "tween", duration: 0.2 }}
          >
            <button
              onClick={() => onClose(sent)}
              aria-label="Close"
              className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            {sent ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="mx-auto h-14 w-14 text-india-green" />
                <h2 className="mt-3 text-xl font-semibold">Thanks! We&apos;ll be in touch.</h2>
                <p className="mt-2 text-sm text-muted-foreground">Our team will call or email you within one working day.</p>
                <Button className="mt-5" onClick={() => onClose(true)}>
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="p-6 sm:p-7" noValidate>
                <div className="flex items-center gap-3 pr-8">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-saffron/15 text-saffron-dark dark:text-saffron">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <h2 id="bulk-title" className="text-xl font-bold tracking-tight">
                    {popup.title}
                  </h2>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{popup.message}</p>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input id="bulk-name" label="Your name" value={form.name} onChange={set("name")} error={errors.name} autoComplete="name" />
                  <Input id="bulk-company" label="Company" value={form.company} onChange={set("company")} error={errors.company} autoComplete="organization" />
                  <Input id="bulk-phone" label="Phone" type="tel" inputMode="tel" value={form.phone} onChange={set("phone")} error={errors.phone} autoComplete="tel" />
                  <Input id="bulk-email" label="Work email" type="email" value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" />
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium">People to hire</span>
                    <select
                      value={form.hires}
                      onChange={set("hires")}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-saffron/50"
                    >
                      <option value="">Choose</option>
                      {hiresOptions.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                    {errors.hires && <span className="mt-1 block text-xs text-red-500">{errors.hires}</span>}
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium">City (optional)</span>
                    <select
                      value={form.city}
                      onChange={set("city")}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-saffron/50"
                    >
                      <option value="">Any / multiple</option>
                      {locations.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="mt-3 block">
                  <span className="mb-1.5 block text-sm font-medium">Roles or details (optional)</span>
                  <textarea
                    value={form.notes}
                    onChange={set("notes")}
                    rows={2}
                    maxLength={1000}
                    placeholder="e.g. 30 telecallers and 5 team leads, joining next month"
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-saffron/50"
                  />
                </label>

                {!preview && (
                  <div className="mt-3">
                    <Turnstile onToken={setCaptcha} resetSignal={captchaReset} />
                  </div>
                )}
                {serverError && <p className="mt-3 text-sm text-red-500">{serverError}</p>}
                {preview && <p className="mt-3 text-xs text-muted-foreground">Preview — nothing is sent from here.</p>}

                <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2">
                  <Button type="button" variant="ghost" className="sm:flex-1" onClick={() => onClose(false)}>
                    Not now
                  </Button>
                  <Button type="submit" className="sm:flex-1" loading={sending}>
                    Request a callback
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
