import { Link } from "@tanstack/react-router";
import { LayoutDashboard, ScanLine } from "lucide-react";
import { BrandMark } from "./brand";
import { ModeBadge } from "./mode-badge";

const navLink =
  "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground";
const navActive = { className: "bg-secondary text-foreground" };

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <BrandMark />
          <span className="font-display text-lg font-bold tracking-tight">
            Notice<span className="text-gradient">Guard</span>
          </span>
        </Link>
        <ModeBadge className="ml-1 hidden md:inline-flex" />
        <nav className="ml-auto flex items-center gap-1">
          <Link to="/verify" className={navLink} activeProps={navActive}>
            <ScanLine className="size-4" />
            <span className="hidden sm:inline">Verify notice</span>
          </Link>
          <Link to="/admin" className={navLink} activeProps={navActive}>
            <LayoutDashboard className="size-4" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>NoticeGuard · QR access and digital signature verification are independent checks.</p>
        <p className="font-mono">SHA-256 · ECDSA P-256</p>
      </div>
    </footer>
  );
}
