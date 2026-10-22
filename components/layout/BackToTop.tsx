"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/** Floating "back to top" button, shown after scrolling down a screen or two. */
export function BackToTop() {
  const [show, setShow] = useState(false);
  // Job pages have a fixed contact bar at the bottom on phones; sit above it.
  const aboveBar = usePathname().startsWith("/jobs/");

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className={cn(
        "fixed right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-saffron text-white shadow-lg shadow-saffron/30 transition-transform hover:scale-105",
        aboveBar ? "bottom-24 lg:bottom-5" : "bottom-5"
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
