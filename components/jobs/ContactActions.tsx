"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Mail, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { RecruiterContact } from "@/types";

/**
 * The two direct-outreach actions on every job: Number (call / WhatsApp)
 * and Email (mailto / copy). Details stay hidden until the candidate asks.
 */
export function ContactActions({
  contact,
  jobTitle,
}: {
  contact: RecruiterContact;
  jobTitle: string;
}) {
  const [revealed, setRevealed] = useState<"phone" | "email" | null>(null);
  const [copied, setCopied] = useState(false);

  const phone = contact.phone?.trim();
  const email = contact.email?.trim();
  if (!phone && !email) return null;

  const copyEmail = async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the address is still shown.
    }
  };

  const digits = phone?.replace(/\D/g, "") ?? "";
  const whatsapp = `https://wa.me/${digits}?text=${encodeURIComponent(
    `Hi, I'm interested in the "${jobTitle}" role I saw on Joblay.`
  )}`;
  const mailto = `mailto:${email}?subject=${encodeURIComponent(`Application: ${jobTitle}`)}`;

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {phone && (
        <div className="flex-1">
          {revealed === "phone" ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-xl border border-border bg-muted/50 p-3 text-sm"
            >
              <p className="font-mono font-medium">{phone}</p>
              <div className="flex gap-2 mt-2">
                <a href={`tel:${phone}`} className="flex-1">
                  <Button size="sm" variant="secondary" className="w-full">
                    <Phone className="h-3.5 w-3.5" />
                    Call
                  </Button>
                </a>
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button size="sm" variant="outline" className="w-full">
                    <MessageCircle className="h-3.5 w-3.5" />
                    WhatsApp
                  </Button>
                </a>
              </div>
            </motion.div>
          ) : (
            <Button size="sm" variant="secondary" className="w-full" onClick={() => setRevealed("phone")}>
              <Phone className="h-3.5 w-3.5" />
              Number
            </Button>
          )}
        </div>
      )}

      {email && (
        <div className="flex-1">
          {revealed === "email" ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-xl border border-border bg-muted/50 p-3 text-sm"
            >
              <p className="font-mono font-medium break-all">{email}</p>
              <div className="flex gap-2 mt-2">
                <a href={mailto} className="flex-1">
                  <Button size="sm" className="w-full">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </Button>
                </a>
                <Button size="sm" variant="outline" onClick={copyEmail} className="flex-1">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </motion.div>
          ) : (
            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                setRevealed("email");
                copyEmail();
              }}
            >
              <Mail className="h-3.5 w-3.5" />
              Email
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
