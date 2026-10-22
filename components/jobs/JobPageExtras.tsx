"use client";

import { useEffect, useState } from "react";
import { Check, Link2 } from "lucide-react";
import { trackJob } from "@/lib/trackJob";

/** Counts one view of the job page (once per session). Renders nothing. */
export function TrackJobView({ jobId }: { jobId: string }) {
  useEffect(() => trackJob(jobId, "view"), [jobId]);
  return null;
}

/** "Copy link" next to the WhatsApp share. */
export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: fall back to letting the user copy it by hand.
      window.prompt("Copy this link:", url);
    }
  };
  return (
    <button type="button" onClick={copy} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
      {copied ? <Check className="h-4 w-4 text-india-green" /> : <Link2 className="h-4 w-4" />}
      {copied ? "Link copied" : "Copy link"}
    </button>
  );
}
