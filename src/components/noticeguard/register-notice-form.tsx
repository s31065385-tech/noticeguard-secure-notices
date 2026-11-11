import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, ImageIcon, Loader2, PenLine, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ACCEPTED_MIME_TYPES, api, MAX_FILE_BYTES, type AdminSession, type Notice } from "@/lib/api";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

const DEPARTMENTS = [
  "Office of Examinations",
  "Academic Affairs",
  "Administration",
  "Finance & Accounts",
  "Human Resources",
  "Student Welfare",
];

const schema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(160, "Title is too long"),
  department: z.string().trim().min(2, "Department is required").max(80, "Department name is too long"),
  noticeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the notice date"),
  file: z
    .instanceof(File, { message: "Attach the notice file" })
    .refine((f) => (ACCEPTED_MIME_TYPES as readonly string[]).includes(f.type), "Only PDF, PNG, JPG or WEBP files")
    .refine((f) => f.size <= MAX_FILE_BYTES, `File must be ${formatBytes(MAX_FILE_BYTES)} or smaller`)
    .refine((f) => f.size > 0, "File is empty"),
});

type Errors = Partial<Record<"title" | "department" | "noticeDate" | "file", string>>;

export function RegisterNoticeForm({
  session,
  onRegistered,
}: {
  session: AdminSession;
  onRegistered: (notice: Notice) => void;
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [noticeDate, setNoticeDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const register = useMutation({
    mutationFn: (input: z.infer<typeof schema>) => api.registerNotice(input, session),
    onSuccess: async (notice) => {
      await queryClient.invalidateQueries({ queryKey: ["notices"] });
      toast.success("Notice registered and signed", { description: notice.id });
      setTitle("");
      setFile(null);
      setErrors({});
      onRegistered(notice);
    },
    onError: (e: Error) => toast.error("Registration failed", { description: e.message }),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ title, department, noticeDate, file });
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errors;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    register.mutate(parsed.data);
  }

  const FileIcon = file?.type === "application/pdf" ? FileText : ImageIcon;

  return (
    <form onSubmit={submit} className="glass-panel space-y-5 rounded-2xl p-5 sm:p-6" noValidate>
      <div>
        <h2 className="text-lg font-bold">Register official notice</h2>
        <p className="text-sm text-muted-foreground">The file is hashed (SHA-256) and digitally signed on registration.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Notice title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. End-semester examination schedule" className="h-11" aria-invalid={!!errors.title} />
        {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input id="department" list="ng-departments" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Select or type" className="h-11" aria-invalid={!!errors.department} />
          <datalist id="ng-departments">
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
          {errors.department && <p className="text-xs text-destructive">{errors.department}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="noticeDate">Notice date</Label>
          <Input id="noticeDate" type="date" value={noticeDate} onChange={(e) => setNoticeDate(e.target.value)} className="h-11 [color-scheme:dark]" aria-invalid={!!errors.noticeDate} />
          {errors.noticeDate && <p className="text-xs text-destructive">{errors.noticeDate}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notice file</Label>
        {file ? (
          <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 p-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <FileIcon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(file.size)} · {file.type || "unknown type"}</p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => setFile(null)} aria-label="Remove file">
              <X />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) setFile(f);
            }}
            className={cn(
              "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-all",
              dragging ? "border-primary bg-primary/10" : "hover:border-primary/50 hover:bg-secondary/40",
              errors.file && "border-destructive/60",
            )}
          >
            <UploadCloud className="size-8 text-primary" />
            <p className="text-sm font-medium">Drop a PDF or image, or click to browse</p>
            <p className="text-xs text-muted-foreground">PDF, PNG, JPG, WEBP · up to {formatBytes(MAX_FILE_BYTES)}</p>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_MIME_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setFile(f);
            e.target.value = "";
          }}
        />
        {errors.file && <p className="text-xs text-destructive">{errors.file}</p>}
      </div>

      <Button type="submit" variant="hero" size="xl" className="w-full" disabled={register.isPending}>
        {register.isPending ? <Loader2 className="animate-spin" /> : <PenLine />}
        {register.isPending ? "Hashing and signing…" : "Register & sign notice"}
      </Button>
    </form>
  );
}
