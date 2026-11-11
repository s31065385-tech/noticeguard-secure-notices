import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-9 items-center justify-center rounded-lg bg-gradient-brand shadow-glow",
        className,
      )}
    >
      <ShieldCheck className="size-5 text-primary-foreground" strokeWidth={2.4} />
    </span>
  );
}

export function SectionEyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-primary",
        className,
      )}
    >
      {children}
    </p>
  );
}
