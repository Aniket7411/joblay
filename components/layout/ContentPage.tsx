import type { LucideIcon } from "lucide-react";

interface ContentPageProps {
  icon: LucideIcon;
  title: string;
  intro?: string;
  updated?: string;
  children: React.ReactNode;
}

/** Shared shell for static content pages (about, legal, FAQ, safety). */
export function ContentPage({
  icon: Icon,
  title,
  intro,
  updated,
  children,
}: ContentPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <header className="mb-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-saffron/10 text-saffron mb-5">
          <Icon className="h-6 w-6" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
        {intro && (
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            {intro}
          </p>
        )}
        {updated && (
          <p className="mt-3 text-xs text-muted-foreground">
            Last updated: {updated}
          </p>
        )}
      </header>
      <div className="prose-joblay">{children}</div>
    </div>
  );
}
