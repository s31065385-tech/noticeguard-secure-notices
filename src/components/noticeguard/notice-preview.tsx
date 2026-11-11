import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, FileWarning } from "lucide-react";
import { noticeFileQuery, type Notice } from "@/lib/api";

export function NoticePreview({ notice }: { notice: Notice }) {
  const { data: blob, isError } = useQuery(noticeFileQuery(notice.id));
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) return;
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  if (isError) {
    return (
      <div className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground">
        <FileWarning className="size-6 text-destructive" />
        The registered file could not be loaded.
      </div>
    );
  }

  if (!url) return <div className="aspect-[4/5] w-full animate-pulse rounded-xl bg-muted" />;

  const isPdf = notice.mimeType === "application/pdf";
  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border bg-muted/40">
        {isPdf ? (
          <iframe title={notice.title} src={url} className="h-[60vh] min-h-[420px] w-full" />
        ) : (
          <img src={url} alt={notice.title} className="mx-auto max-h-[70vh] w-auto object-contain" />
        )}
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        <ExternalLink className="size-3.5" /> Open original file in a new tab
      </a>
    </div>
  );
}
