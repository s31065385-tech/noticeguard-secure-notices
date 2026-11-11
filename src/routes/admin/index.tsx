import { useState } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ExternalLink, FileStack, FileText, ImageIcon, LogOut, QrCode, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionEyebrow } from "@/components/noticeguard/brand";
import { DemoDisclosure } from "@/components/noticeguard/mode-badge";
import { NoticeQrDialog } from "@/components/noticeguard/notice-qr-dialog";
import { RegisterNoticeForm } from "@/components/noticeguard/register-notice-form";
import { noticesQuery, type Notice } from "@/lib/api";
import { clearAdminSession, getAdminSession } from "@/lib/admin-session";
import { formatBytes, formatDate, shortHash } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  beforeLoad: () => {
    const session = getAdminSession();
    if (!session) throw redirect({ to: "/admin/login" });
    return { session };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(noticesQuery()),
  head: () => ({
    meta: [
      { title: "Admin dashboard — NoticeGuard" },
      { name: "description", content: "Register, sign and publish official notices with QR access codes." },
      { property: "og:title", content: "Admin dashboard — NoticeGuard" },
      { property: "og:description", content: "Register official notices and generate QR codes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  pendingComponent: () => (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="h-40 animate-pulse rounded-2xl bg-muted/50" />
    </div>
  ),
  component: AdminDashboard,
});

function Stat({ icon: Icon, label, value }: { icon: typeof FileStack; label: string; value: string | number }) {
  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4 text-primary" />
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function NoticeRow({ notice, onQr }: { notice: Notice; onQr: () => void }) {
  const isPdf = notice.mimeType === "application/pdf";
  const Icon = isPdf ? FileText : ImageIcon;
  return (
    <li className="animate-fade-up rounded-xl border bg-background/40 p-4 transition-colors hover:border-primary/40">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{notice.title}</p>
          <p className="text-sm text-muted-foreground">
            {notice.department} · {formatDate(notice.noticeDate)}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
            <span>{notice.id}</span>
            <span>{formatBytes(notice.fileSize)}</span>
            <span title={notice.sha256}>sha256 {shortHash(notice.sha256, 6)}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-2 sm:justify-end">
        <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={onQr}>
          <QrCode /> QR code
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 sm:flex-none" asChild>
          <Link to="/verify/$noticeId" params={{ noticeId: notice.id }}>
            <ExternalLink /> Open
          </Link>
        </Button>
      </div>
    </li>
  );
}

function AdminDashboard() {
  const { session } = Route.useRouteContext();
  const { data: notices } = useSuspenseQuery(noticesQuery());
  const [qrNotice, setQrNotice] = useState<Notice | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const pdfCount = notices.filter((n) => n.mimeType === "application/pdf").length;

  async function signOut() {
    await queryClient.cancelQueries();
    clearAdminSession();
    navigate({ to: "/admin/login", replace: true });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionEyebrow>Admin dashboard</SectionEyebrow>
          <h1 className="mt-1 text-3xl font-bold">Official notices</h1>
          <p className="text-sm text-muted-foreground">Signed in as {session.username}</p>
        </div>
        <Button variant="outline" onClick={signOut}>
          <LogOut /> Sign out
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={FileStack} label="Registered" value={notices.length} />
        <Stat icon={FileText} label="PDF notices" value={pdfCount} />
        <Stat icon={ImageIcon} label="Image notices" value={notices.length - pdfCount} />
        <Stat icon={ShieldCheck} label="Signed" value={notices.filter((n) => n.signature).length} />
      </div>

      <DemoDisclosure className="mt-6">
        Notices, files and the issuer signing key are stored in this browser only, so QR codes open on this device.
        Connect the FastAPI backend to share notices across devices and keep the signing key server-side.
      </DemoDisclosure>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <RegisterNoticeForm session={session} onRegistered={setQrNotice} />
        </div>

        <section className="glass-panel rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Registered notices</h2>
            <span className="font-mono text-xs text-muted-foreground">{notices.length} total</span>
          </div>
          {notices.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center">
              <FileStack className="size-8 text-muted-foreground" />
              <p className="font-medium">No notices yet</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Register your first notice to generate its signature and QR code.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {notices.map((n) => (
                <NoticeRow key={n.id} notice={n} onQr={() => setQrNotice(n)} />
              ))}
            </ul>
          )}
        </section>
      </div>

      <NoticeQrDialog notice={qrNotice} onOpenChange={(open) => !open && setQrNotice(null)} />
    </div>
  );
}
