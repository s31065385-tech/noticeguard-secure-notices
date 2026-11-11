import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download, ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Notice } from "@/lib/api";
import { buildNoticeUrl } from "@/lib/qr";

export function useNoticeQr(id: string | undefined, size = 640) {
  const [state, setState] = useState<{ url: string; dataUrl: string } | null>(null);
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const url = buildNoticeUrl(id, window.location.origin);
    import("qrcode").then(async (QRCode) => {
      const dataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: size,
        // High-contrast modules are required for reliable scanning.
        color: { dark: "#0b1226", light: "#ffffff" },
      });
      if (!cancelled) setState({ url, dataUrl });
    });
    return () => {
      cancelled = true;
    };
  }, [id, size]);
  return state;
}

export function NoticeQrDialog({
  notice,
  onOpenChange,
}: {
  notice: Notice | null;
  onOpenChange: (open: boolean) => void;
}) {
  const qr = useNoticeQr(notice?.id);
  return (
    <Dialog open={!!notice} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel max-w-md border-border sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Notice access QR</DialogTitle>
          <DialogDescription className="line-clamp-2">{notice?.title}</DialogDescription>
        </DialogHeader>
        <div className="mx-auto w-full max-w-[280px] rounded-2xl bg-qr-surface p-3 shadow-glow">
          {qr ? (
            <img src={qr.dataUrl} alt={`QR code for notice ${notice?.id}`} className="aspect-square w-full" />
          ) : (
            <div className="aspect-square w-full animate-pulse rounded-lg bg-muted" />
          )}
        </div>
        <p className="text-center font-mono text-xs text-muted-foreground">{notice?.id}</p>
        <div className="flex gap-2 rounded-lg border border-primary/25 bg-primary/5 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          This QR only opens the registered notice. Readers must run signature verification
          separately to confirm authenticity.
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" asChild disabled={!qr}>
            <a href={qr?.dataUrl} download={`${notice?.id ?? "notice"}-qr.png`}>
              <Download /> Download
            </a>
          </Button>
          {notice && (
            <Button variant="hero" asChild>
              <Link to="/verify/$noticeId" params={{ noticeId: notice.id }}>
                <ExternalLink /> Open
              </Link>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
