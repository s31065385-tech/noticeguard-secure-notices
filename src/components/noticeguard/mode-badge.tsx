import { FlaskConical, Server } from "lucide-react";
import { isDemoMode } from "@/lib/api";
import { cn } from "@/lib/utils";

export function ModeBadge({ className }: { className?: string }) {
  return isDemoMode ? (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-warning",
        className,
      )}
      title="No verification backend connected. Results are computed in this browser."
    >
      <FlaskConical className="size-3" /> Demo mode
    </span>
  ) : (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-success",
        className,
      )}
    >
      <Server className="size-3" /> Backend connected
    </span>
  );
}

export function DemoDisclosure({ className, children }: { className?: string; children?: React.ReactNode }) {
  if (!isDemoMode) return null;
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-muted-foreground",
        className,
      )}
    >
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-warning" />
      <p>
        <span className="font-semibold text-warning">Simulated demo environment.</span>{" "}
        {children ??
          "Hashing and ECDSA signatures run for real in your browser, but the signing key and notices are stored on this device only. Results are not production proof of authenticity until NoticeGuard is connected to the FastAPI verification service."}
      </p>
    </div>
  );
}
