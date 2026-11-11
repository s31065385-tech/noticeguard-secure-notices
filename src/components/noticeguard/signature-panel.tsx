import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2,
  FileUp,
  FlaskConical,
  Fingerprint,
  KeyRound,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, noticeFileQuery, type Notice, type VerificationResult, type VerifyCandidate } from "@/lib/api";
import { tamperBytes } from "@/lib/crypto";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { HashCompare } from "./hash-compare";

const SOURCE_LABEL: Record<VerificationResult["candidateSource"], string> = {
  "registered-file": "Registered original",
  "uploaded-copy": "Uploaded copy",
  "tamper-test": "Modified copy (tamper test)",
};

function CheckRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-background/40 p-3">
      {ok ? (
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
      ) : (
        <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
      )}
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function ResultView({ result }: { result: VerificationResult }) {
  const valid = result.status === "valid";
  return (
    <div key={result.checkedAt} className="animate-fade-up space-y-5">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border p-5",
          valid ? "border-success/50 bg-success/10 shadow-glow-success" : "border-destructive/50 bg-destructive/10 shadow-glow-danger",
        )}
      >
        <div className="flex items-start gap-4">
          <span
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-xl",
              valid ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground",
            )}
          >
            {valid ? <ShieldCheck className="size-6" /> : <ShieldAlert className="size-6" />}
          </span>
          <div className="min-w-0">
            <p className={cn("font-display text-2xl font-bold", valid ? "text-success" : "text-destructive")}>
              {valid ? "Signature Valid" : "Signature Invalid"}
            </p>
            <p className="mt-1 text-sm text-foreground/85">
              {valid
                ? "This document matches the issuer's digital signature exactly. It has not been altered since it was registered."
                : "This document does not match the issuer's digital signature. It may have been modified, re-saved or substituted — do not rely on it."}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Checked: {SOURCE_LABEL[result.candidateSource]} · {result.candidateName}
            </p>
          </div>
        </div>
        {result.simulated && (
          <span className="absolute right-3 top-3 hidden items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-warning sm:inline-flex">
            <FlaskConical className="size-3" /> Simulated demo
          </span>
        )}
      </div>

      {result.simulated && (
        <p className="flex gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-muted-foreground">
          <FlaskConical className="mt-0.5 size-3.5 shrink-0 text-warning" />
          <span>
            <span className="font-semibold text-warning">Simulated demo result.</span> The SHA-256 and ECDSA
            checks really ran in your browser, but against a demo key stored on this device. Connect the
            FastAPI verification API for a trusted, production result.
          </span>
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <CheckRow
          ok={result.hashMatch}
          label="Integrity · SHA-256"
          detail={result.hashMatch ? "Document fingerprint matches the registered hash." : "Document fingerprint does not match."}
        />
        <CheckRow
          ok={result.signatureValid}
          label={`Authenticity · ${result.algorithm}`}
          detail={result.signatureValid ? "Issuer signature verified with the public key." : "Issuer signature failed to verify."}
        />
      </div>

      <HashCompare registeredHash={result.registeredHash} computedHash={result.computedHash} match={result.hashMatch} />

      <dl className="grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <KeyRound className="size-3.5" />
          <dt>Issuer key</dt>
          <dd className="truncate font-mono text-foreground">{result.keyFingerprint}</dd>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Fingerprint className="size-3.5" />
          <dt>Checked at</dt>
          <dd className="font-mono text-foreground">{formatDateTime(result.checkedAt)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function SignaturePanel({ notice }: { notice: Notice }) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const verify = useMutation({
    mutationFn: (candidate: VerifyCandidate) => api.verifySignature(notice.id, candidate),
    onMutate: () => setResult(null),
    onSuccess: (r) => {
      setResult(r);
      if (r.status === "valid") toast.success("Signature Valid", { description: "Document is authentic and unmodified." });
      else toast.error("Signature Invalid", { description: "Document does not match the registered signature." });
    },
    onError: (e: Error) => toast.error("Verification could not run", { description: e.message }),
  });

  async function runTamperTest() {
    try {
      const original = await queryClient.fetchQuery(noticeFileQuery(notice.id));
      const modified = new Blob([tamperBytes(await original.arrayBuffer())], { type: original.type });
      verify.mutate({ source: "tamper-test", file: modified, fileName: `modified-${notice.fileName}` });
    } catch (e) {
      toast.error("Could not prepare the modified copy", { description: (e as Error).message });
    }
  }

  const pending = verify.isPending;

  return (
    <section className="glass-panel rounded-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-violet">Feature 2 · Independent check</p>
          <h2 className="mt-1 text-xl font-bold">Digital signature verification</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Recomputes the SHA-256 fingerprint and verifies the issuer's ECDSA signature.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <Button
          variant="hero"
          size="xl"
          className="sm:col-span-3"
          disabled={pending}
          onClick={() => verify.mutate({ source: "registered-file" })}
        >
          {pending ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
          {pending ? "Verifying signature…" : "Verify Digital Signature"}
        </Button>
        <Button variant="outline" className="sm:col-span-2" disabled={pending} onClick={() => fileRef.current?.click()}>
          <FileUp /> Verify a copy I have
        </Button>
        <Button variant="danger" disabled={pending} onClick={runTamperTest}>
          <FlaskConical /> Tamper test
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) verify.mutate({ source: "uploaded-copy", file: f, fileName: f.name });
            e.target.value = "";
          }}
        />
      </div>

      <div className="mt-6">
        {pending ? (
          <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
            <Loader2 className="size-6 animate-spin text-primary" />
            <div>
              <p className="font-medium">Computing SHA-256 and verifying signature…</p>
              <p className="text-xs text-muted-foreground">Comparing against the fingerprint registered by the issuer.</p>
            </div>
          </div>
        ) : result ? (
          <ResultView result={result} />
        ) : (
          <div className="flex items-start gap-3 rounded-2xl border border-dashed p-5">
            <ShieldQuestion className="size-6 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">Authenticity not verified yet</p>
              <p className="text-sm text-muted-foreground">
                Opening this notice by QR code does not prove it is genuine. Run the signature check above,
                or upload a copy you received to compare it with the original.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
