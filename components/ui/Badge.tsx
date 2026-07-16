import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "saffron" | "green" | "outline";
  className?: string;
}

const variants = {
  default: "bg-muted text-muted-foreground",
  saffron: "bg-saffron/15 text-saffron-dark dark:text-saffron",
  green: "bg-india-green/15 text-india-green-dark dark:text-india-green",
  outline: "border border-border text-muted-foreground",
};

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
