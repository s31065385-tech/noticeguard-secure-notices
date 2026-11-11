import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, CalendarDays, FileSearch, FileText, Hash, KeyRound, QrCode, ScanLine, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoDisclosure } from "@/components/noticeguard/mode-badge";
import { NoticePreview } from "@/components/noticeguard/notice-preview";
import { SignaturePanel } from "@/components/noticeguard/signature-panel";
import { isDemoMode, noticeQuery, type Notice } from "@/lib/api";
import { formatBytes, formatDate, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/verify/$noticeId")({
  ssr: false,
  loader: ({ context, params }) => context.queryClient.ensureQueryData(noticeQuery(params.noticeId)),
  head: ({ params }) => ({
    meta: [
      { title: `Notice ${params.noticeId} — NoticeGuard` },
      { name: "description", content: "View the registered official notice and verify its digital signature with NoticeGuard." },
      { property: "og:title", content: `Notice ${params.noticeId} — NoticeGuard` },
      { property: "og:description", content: "Registered official notice with independent digital signature verification." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  pendingComponent: () => (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="h-24 animate-pulse rounded-2xl bg-muted/50" />
      <div className="mt-6 h-96 animate-pulse rounded-2xl bg-muted/40" />
    </div>
  ),
  component: NoticeView,
});

function MetaItem({ icon: Icon, label, value, mono }: { icon: typeof Hash; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-3 py-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
        <dd className={mono ? "break-all font-mono text-xs" : "text-sm"}>{value}</dd>
      </div>
    </div>
  );
}

function NotFound({ id }: { id: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
        <FileSearch className="size-7" />
      </span>
      <h1 className="mt-5 text-2xl font-bold">No registered notice found</h1>
      <p className="mt-2 text-muted-foreground">
        <span className="font-mono text-foreground">{id}</span> isn't in the NoticeGuard registry. Treat any document
        carrying this code as unverified.
      </p>
      {isDemoMode && (
        <p className="mt-3 text-sm text-muted-foreground">
          In demo mode notices live only in the browser that registered them.
        </p>
      )}
      <Button variant="hero" className="mt-6" asChild>
        <Link to="/verify">
          <ScanLine /> Scan another code
        </Link>
      </Button>
    </div>
  );
}

function NoticeView() {
  const { noticeId } = Route.useParams();
  const { data: notice } = useSuspenseQuery(noticeQuery(noticeId));
  if (!notice) return <NotFound id={noticeId} />;
  return <NoticeDetail notice={notice} />;
}

function NoticeDetail({ notice }: { notice: Notice }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/verify">
          <ArrowLeft /> Scan another
        </Link>
      </Button>

      {/* Feature 1 status: record located — deliberately not styled as "verified". */}
      <div className="mt-3 flex animate-fade-up flex-col gap-3 rounded-2xl border border-primary/35 bg-primary/5 p-4 sm:flex-row sm:items-center">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <QrCode className="size-5" />
        </span>
        <div className="flex-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Feature 1 · QR access</p>
          <p className="font-medium">Registered notice located</p>
          <p className="text-sm text-muted-foreground">
            This is the original on file. Locating it is not proof of authenticity — verify the signature below.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="glass-panel animate-fade-up rounded-2xl p-5 sm:p-6">
            <h1 className="text-2xl font-bold sm:text-3xl">{notice.title}</h1>
            <p className="mt-1 text-muted-foreground">
              {notice.department} · {formatDate(notice.noticeDate)}
            </p>
            <div className="mt-5">
              <NoticePreview notice={notice} />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <SignaturePanel notice={notice} />

          <section className="glass-panel rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg font-bold">Notice metadata</h2>
            <dl className="mt-2 divide-y divide-border/60">
              <MetaItem icon={Hash} label="Notice ID" value={notice.id} mono />
              <MetaItem icon={Building2} label="Department" value={notice.department} />
              <MetaItem icon={CalendarDays} label="Notice date" value={formatDate(notice.noticeDate)} />
              <MetaItem icon={FileText} label="File" value={`${notice.fileName} · ${formatBytes(notice.fileSize)}`} />
              <MetaItem icon={User} label="Registered" value={`${formatDateTime(notice.registeredAt)} by ${notice.registeredBy}`} />
              <MetaItem icon={KeyRound} label={`Issuer key · ${notice.signatureAlgorithm}`} value={notice.keyFingerprint} mono />
              <MetaItem icon={Hash} label="Registered SHA-256" value={notice.sha256} mono />
            </dl>
          </section>

          <DemoDisclosure />
        </div>
      </div>
    </div>
  );
}
