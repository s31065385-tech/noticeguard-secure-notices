import { cn } from "@/lib/utils";

function HashLine({ label, hash, reference }: { label: string; hash: string; reference?: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="break-all rounded-lg border bg-background/60 p-3 font-mono text-xs leading-relaxed">
        {reference
          ? hash.split("").map((ch, i) => (
              <span key={i} className={ch === reference[i] ? "text-foreground" : "rounded-sm bg-destructive/25 text-destructive"}>
                {ch}
              </span>
            ))
          : hash}
      </p>
    </div>
  );
}

export function HashCompare({
  registeredHash,
  computedHash,
  match,
}: {
  registeredHash: string;
  computedHash: string;
  match: boolean;
}) {
  return (
    <div className="space-y-3">
      <HashLine label="Registered SHA-256 (at signing)" hash={registeredHash} />
      <HashLine label="Computed SHA-256 (this document)" hash={computedHash} reference={registeredHash} />
      <p className={cn("text-xs font-medium", match ? "text-success" : "text-destructive")}>
        {match
          ? "Hashes are identical — not a single byte has changed."
          : "Hashes differ — highlighted characters show where the fingerprints diverge."}
      </p>
    </div>
  );
}
