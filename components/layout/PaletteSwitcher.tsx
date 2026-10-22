"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Palette } from "lucide-react";
import { useMounted } from "@/hooks/useMounted";
import { PALETTE_KEY, palettes } from "@/lib/palettes";
import { cn } from "@/lib/utils";

function applyPalette(id: string) {
  const root = document.documentElement;
  if (id === "saffron") delete root.dataset.palette;
  else root.dataset.palette = id;
  try {
    localStorage.setItem(PALETTE_KEY, id);
  } catch {}
}

export function PaletteSwitcher() {
  const mounted = useMounted();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("saffron");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with the attribute set before paint
    setCurrent(document.documentElement.dataset.palette ?? "saffron");
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!mounted) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Choose colour theme"
        aria-expanded={open}
      >
        <Palette className="h-4 w-4 text-saffron" />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-52 rounded-xl border border-border bg-surface p-1.5 shadow-xl">
          <p className="px-2.5 pt-1 pb-2 text-xs font-medium text-muted-foreground">Colour theme</p>
          {palettes.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                applyPalette(p.id);
                setCurrent(p.id);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm hover:bg-muted",
                current === p.id && "bg-muted font-medium"
              )}
            >
              <span className="flex">
                <span className="h-4 w-4 rounded-full ring-2 ring-surface" style={{ background: p.primary }} />
                <span className="-ml-1.5 h-4 w-4 rounded-full ring-2 ring-surface" style={{ background: p.secondary }} />
              </span>
              <span className="flex-1 text-left">{p.name}</span>
              {current === p.id && <Check className="h-4 w-4 text-saffron" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
