import { useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/noticeguard/brand";
import { api, isDemoMode } from "@/lib/api";
import { DEMO_CREDENTIALS } from "@/lib/api/demo";
import { getAdminSession, setAdminSession } from "@/lib/admin-session";

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  beforeLoad: () => {
    if (getAdminSession()) throw redirect({ to: "/admin" });
  },
  head: () => ({
    meta: [
      { title: "Admin sign in — NoticeGuard" },
      { name: "description", content: "Sign in to the NoticeGuard admin console to register and sign official notices." },
      { property: "og:title", content: "Admin sign in — NoticeGuard" },
      { property: "og:description", content: "Secure admin access for registering official notices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const session = await api.login(username, password);
      setAdminSession(session);
      toast.success(`Signed in as ${session.username}`);
      navigate({ to: "/admin", replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:py-24">
      <div className="glass-panel animate-fade-up rounded-3xl p-7 sm:p-8">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <h1 className="text-xl font-bold">Admin console</h1>
            <p className="text-sm text-muted-foreground">Authorised notice issuers only</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-7 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11"
            />
          </div>
          {error && (
            <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" variant="hero" size="xl" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <LockKeyhole />} Sign in
          </Button>
        </form>

        {isDemoMode && (
          <div className="mt-6 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm">
            <p className="font-semibold text-warning">Demo authentication</p>
            <p className="mt-1 text-muted-foreground">
              Checked in the browser until the FastAPI login is connected. Use{" "}
              <code className="font-mono text-foreground">{DEMO_CREDENTIALS.username}</code> /{" "}
              <code className="font-mono text-foreground">{DEMO_CREDENTIALS.password}</code>.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 px-0 text-warning hover:bg-transparent hover:text-warning/80"
              onClick={() => {
                setUsername(DEMO_CREDENTIALS.username);
                setPassword(DEMO_CREDENTIALS.password);
              }}
            >
              Fill demo credentials
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
