"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, Mail, Phone, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { JobPosting } from "@/types";

interface JobCardProps {
  job: JobPosting;
  index?: number;
}

export function JobCard({ job, index = 0 }: JobCardProps) {
  const [revealed, setRevealed] = useState<"phone" | "email" | null>(null);
  const [copied, setCopied] = useState(false);

  const hasPhone = Boolean(job.contact.phone?.trim());
  const hasEmail = Boolean(job.contact.email?.trim());

  const handleCopyEmail = async () => {
    if (!job.contact.email) return;
    await navigator.clipboard.writeText(job.contact.email);
    setCopied(true);
    setRevealed("email");
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappLink = job.contact.phone
    ? `https://wa.me/${job.contact.phone.replace(/\D/g, "")}`
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <Card hover className="h-full flex flex-col p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-lg leading-tight">{job.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {job.company} · {job.location}
            </p>
          </div>
          <Badge variant="saffron">{job.jobProfile}</Badge>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          <Badge variant="green">{job.industry}</Badge>
          <Badge variant="outline">{job.subRole}</Badge>
          {job.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-3 flex-1 mb-4">
          {job.description}
        </p>

        <ul className="text-xs text-muted-foreground space-y-1 mb-5 border-t border-border pt-4">
          {job.criteria.slice(0, 3).map((c) => (
            <li key={c} className="flex items-start gap-2">
              <span className="text-saffron mt-0.5">•</span>
              {c}
            </li>
          ))}
        </ul>

        {job.contact.name && (
          <p className="text-xs text-muted-foreground mb-3">
            Contact: <span className="font-medium text-foreground">{job.contact.name}</span>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2 mt-auto">
          {hasPhone && (
            <div className="flex-1">
              {revealed === "phone" ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-xl border border-border bg-muted/50 p-3 text-sm"
                >
                  <p className="font-mono font-medium">{job.contact.phone}</p>
                  <div className="flex gap-2 mt-2">
                    <a href={`tel:${job.contact.phone}`}>
                      <Button size="sm" variant="secondary" className="w-full">
                        <Phone className="h-3.5 w-3.5" />
                        Call
                      </Button>
                    </a>
                    {whatsappLink && (
                      <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="w-full">
                          WhatsApp
                        </Button>
                      </a>
                    )}
                  </div>
                </motion.div>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  onClick={() => setRevealed("phone")}
                >
                  <Phone className="h-3.5 w-3.5" />
                  Number
                </Button>
              )}
            </div>
          )}

          {hasEmail && (
            <div className="flex-1">
              {revealed === "email" ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-xl border border-border bg-muted/50 p-3 text-sm"
                >
                  <p className="font-mono font-medium break-all">{job.contact.email}</p>
                  <div className="flex gap-2 mt-2">
                    <a href={`mailto:${job.contact.email}`}>
                      <Button size="sm" className="w-full">
                        <Mail className="h-3.5 w-3.5" />
                        Email
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyEmail}
                      className="w-full"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
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
                    handleCopyEmail();
                  }}
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
