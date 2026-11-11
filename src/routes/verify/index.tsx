import { useCallback, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Info, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionEyebrow } from "@/components/noticeguard/brand";
import { QrScanner } from "@/components/noticeguard/qr-scanner";
import { isDemoMode, noticesQuery } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { parseNoticeIdFromQr } from "@/lib/qr";

export const Route = createFileRoute("/verify/")({
  head: () => ({
    meta: [
      { title: "Scan a notice QR code — NoticeGuard" },
      { name: "description", content: "Scan a NoticeGuard QR code to open the official registered notice, then verify its digital signature." },
      { property: "og:title", content: "Scan a notice QR code — NoticeGuard" },
      { property: "og:description", content: "Open the registered original of an official notice by QR code." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerifyScan,
});

function VerifyScan() {
  const navigate = useNavigate();
  const [manual, setManual] = useState("");
  const recent = useQuery({ ...noticesQuery(), enabled: isDemoMode });

  const open = useCallback(
    (payload: string) => {
      const id = parseNoticeIdFromQr(payload);
      if (!id) {
        toast.error("Not a NoticeGuard code", { description: "This QR code doesn't point to a registered notice." });
        return;
      }
      toast.info("QR decoded", { description: "Opening the registered record. Authenticity is checked separately." });
      navigate({ to: "/verify/$noticeId", params: { noticeId: id } });
    },
    [navigate],
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="text-center">
        <SectionEyebrow>Feature 1 · QR notice access</SectionEyebrow>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Scan a notice</h1>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          The QR code takes you to the registered original. You'll verify its digital signature as a separate step.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="glass-panel animate-fade-up rounded-2xl p-5 sm:p-6">
          <QrScanner onDetected={open} />
          <div className="mt-5 flex gap-2 rounded-lg border border-primary/25 bg-primary/5 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            A successful scan only locates the notice record. It is not proof that the document is authentic.
          </div>
        </section>

        <aside className="space-y-4">
          <form
            className="glass-panel rounded-2xl p-5"
            onSubmit={(e) => {
              e.preventDefault();
              open(manual);
            }}
          >
            <h2 className="font-semibold">Enter notice ID</h2>
            <p className="text-xs text-muted-foreground">Printed under the QR code, e.g. NG-20261111-K7QX2M</p>
            <div className="mt-3 flex gap-2">
              <Input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="NG-…" className="h-10 font-mono uppercase" />
              <Button type="submit" variant="hero" size="icon" className="size-10 shrink-0" aria-label="Open notice">
                <Search />
              </Button>
            </div>
          </form>

          {isDemoMode && recent.data && recent.data.length > 0 && (
            <div className="glass-panel rounded-2xl p-5">
              <h2 className="font-semibold">Registered on this device</h2>
              <ul className="mt-3 space-y-1">
                {recent.data.slice(0, 5).map((n) => (
                  <li key={n.id}>
                    <Link
                      to="/verify/$noticeId"
                      params={{ noticeId: n.id }}
                      className="group flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-secondary"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground">{n.department} · {formatDate(n.noticeDate)}</p>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
