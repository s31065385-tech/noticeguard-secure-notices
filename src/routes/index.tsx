import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileCheck2, Fingerprint, KeyRound, QrCode, ScanLine, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionEyebrow } from "@/components/noticeguard/brand";
import { DemoDisclosure } from "@/components/noticeguard/mode-badge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NoticeGuard — QR Notice Access & Signature Verification" },
      {
        name: "description",
        content: "Register official notices, share them by QR code and let anyone verify authenticity with SHA-256 and ECDSA signatures.",
      },
      { property: "og:title", content: "NoticeGuard — QR Notice Access & Signature Verification" },
      {
        property: "og:description",
        content: "Two independent safeguards for official notices: QR access and cryptographic signature verification.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const steps = [
  { icon: Upload, title: "Register", text: "An admin uploads the official PDF or image. NoticeGuard hashes it with SHA-256 and signs it." },
  { icon: QrCode, title: "Share by QR", text: "A QR code is printed on the notice. Scanning it opens the registered original." },
  { icon: FileCheck2, title: "Verify separately", text: "Readers press Verify to recompute the hash and check the issuer's signature." },
];

function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <section className="grid items-center gap-12 pb-16 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:pt-24">
        <div className="animate-fade-up">
          <SectionEyebrow>Official notice security</SectionEyebrow>
          <h1 className="mt-4 text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
            Find the real notice.
            <br />
            <span className="text-gradient">Prove it wasn't changed.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            NoticeGuard pairs QR code access with cryptographic signature verification — two separate checks, so a
            scanned code is never mistaken for proof of authenticity.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button variant="hero" size="xl" asChild>
              <Link to="/verify">
                <ScanLine /> Scan a notice
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link to="/admin">
                Admin console <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md animate-fade-up [animation-delay:150ms]">
          <div className="absolute -inset-6 animate-glow-pulse rounded-[2rem] bg-gradient-brand opacity-20 blur-3xl" />
          <div className="glass-panel relative animate-float rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">NG-20261111-K7QX2M</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
                <ShieldCheck className="size-3.5" /> Signature Valid
              </span>
            </div>
            <p className="mt-4 font-display text-lg font-semibold">End-semester examination schedule</p>
            <p className="text-sm text-muted-foreground">Office of Examinations · 11 Nov 2026</p>
            <div className="mt-5 space-y-2 rounded-xl border bg-background/50 p-3 font-mono text-[11px] leading-relaxed">
              <p className="text-muted-foreground">sha256 registered</p>
              <p className="break-all text-foreground">9f2c4a…e81b07d3</p>
              <p className="pt-1 text-muted-foreground">sha256 computed</p>
              <p className="break-all text-success">9f2c4a…e81b07d3</p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <KeyRound className="size-3.5 text-violet" /> ECDSA P-256 · issuer key verified
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <article className="glass-panel group rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-glow">
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <QrCode className="size-5" />
          </span>
          <SectionEyebrow className="mt-5">Feature 1</SectionEyebrow>
          <h2 className="mt-1 text-2xl font-bold">QR code notice access</h2>
          <p className="mt-2 text-muted-foreground">
            Every registered notice gets a QR code that opens its official record and original file. It answers
            <em> “where is the real notice?”</em> — not <em>“is this copy genuine?”</em>
          </p>
        </article>
        <article className="glass-panel group rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-glow-violet">
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-violet/15 text-violet">
            <Fingerprint className="size-5" />
          </span>
          <SectionEyebrow className="mt-5 text-violet">Feature 2</SectionEyebrow>
          <h2 className="mt-1 text-2xl font-bold">Digital signature verification</h2>
          <p className="mt-2 text-muted-foreground">
            A separate, explicit check. The document's SHA-256 fingerprint is recomputed and the issuer's ECDSA
            signature verified. One changed byte turns the result to <span className="text-destructive">Signature Invalid</span>.
          </p>
        </article>
      </section>

      <section className="mt-16">
        <SectionEyebrow>How it works</SectionEyebrow>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="animate-fade-up rounded-2xl border bg-card/60 p-5"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                <s.icon className="size-5 text-primary" />
                <h3 className="font-semibold">{s.title}</h3>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <DemoDisclosure className="mt-12" />
    </div>
  );
}
