"use client";

import {
  BedDouble,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CreditCard,
  House,
  Link2,
  LogOut,
  PanelLeft,
  Plus,
  Settings,
  Waypoints,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { FeedbackButton } from "@/components/feedback/Feedback";
import { LanguageSwitch } from "@/components/site/LanguageSwitch";
import { LogoMark } from "@/components/ui/Logo";
import { useAuth } from "@/lib/firebase/auth";
import { useLandlord, useMyFlats } from "@/lib/firebase/data";
import { basePath, type T } from "@/lib/i18n";
import { useLocalePath, useT } from "@/lib/i18n/client";
import { LEGAL_PAGES } from "@/lib/legal";
import { isActive } from "@/lib/plans";
import type { Flat, Landlord } from "@/lib/types";

const ICON = { size: 18, strokeWidth: 1.75 } as const;
const SMALL = { size: 15, strokeWidth: 1.75 } as const;

interface ShellState {
  landlord: Landlord | null;
  flats: Flat[];
  flatsLoading: boolean;
  toggleSidebar: () => void;
}

const ShellCtx = createContext<ShellState | null>(null);

export function useShell(): ShellState {
  const ctx = useContext(ShellCtx);
  if (!ctx) throw new Error("useShell must be used inside AppShell");
  return ctx;
}

/** Paths without language prefix, links add it with lp(). */
function flatLinks(id: string, t: T) {
  return [
    { href: `/app/w/${id}`, label: t("Bewerber", "Applicants"), icon: Waypoints },
    { href: `/app/w/${id}/zimmer`, label: t("Zimmer", "Rooms"), icon: BedDouble },
    { href: `/app/w/${id}/link`, label: t("Einladungslink", "Invite link"), icon: Link2 },
    { href: `/app/w/${id}/einstellungen`, label: t("Einstellungen", "Settings"), icon: Settings },
  ];
}

/**
 * Obsidian's workspace: a 44px ribbon of actions on the far left, a sidebar
 * with a file tree (here: flats and their views), and the main pane.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const t = useT();
  const lp = useLocalePath();
  const pathname = usePathname();
  // The current view without /en, so it compares with the plain paths below.
  const path = basePath(pathname);
  const landlord = useLandlord(user?.uid);
  const flats = useMyFlats(user?.uid);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const currentFlatId = path.match(/^\/app\/w\/([^/]+)/)?.[1] ?? null;

  useEffect(() => setMobileOpen(false), [pathname]);

  const toggleSidebar = () => {
    if (window.matchMedia("(max-width: 767px)").matches) setMobileOpen((o) => !o);
    else setSidebarOpen((o) => !o);
  };

  const sub = landlord.data?.subscription;
  const active = isActive(sub);

  const signOutAndLeave = async () => {
    await signOut();
    router.replace(lp("/"));
  };

  const sidebar = (
    <nav className="flex h-full w-[260px] flex-col bg-bg-2" aria-label={t("Wohnungen", "Flats")}>
      <div className="flex h-10 shrink-0 items-center justify-between px-3">
        <span className="ui-label">{t("Wohnungen", "Flats")}</span>
        <div className="flex items-center gap-0.5">
          <Link
            href={lp("/app/neu")}
            className="icon-btn"
            aria-label={t("Neue Wohnung", "New flat")}
            title={t("Neue Wohnung", "New flat")}
          >
            <Plus {...SMALL} />
          </Link>
          <button
            type="button"
            className="icon-btn md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label={t("Schließen", "Close")}
          >
            <X {...SMALL} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {flats.data.map((flat) => {
          const open = !collapsed[flat.id];
          return (
            <div key={flat.id} className="mb-1">
              <button
                type="button"
                className="nav-item w-full text-left"
                onClick={() => setCollapsed((c) => ({ ...c, [flat.id]: open }))}
              >
                {open ? <ChevronDown size={14} strokeWidth={1.75} /> : <ChevronRight size={14} strokeWidth={1.75} />}
                <span className="min-w-0 flex-1 truncate font-medium text-ink">{flat.title || t("Neue Wohnung", "New flat")}</span>
                {flat.status !== "live" ? (
                  <span className="rounded-sm bg-base-30 px-1.5 text-[11px] text-faint">
                    {flat.status === "draft" ? t("Entwurf", "Draft") : t("Pausiert", "Paused")}
                  </span>
                ) : null}
              </button>
              {open ? (
                <div className="ml-[15px] border-l border-line pl-1.5">
                  {flatLinks(flat.id, t).map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={lp(href)} className={`nav-item ${path === href ? "is-active" : ""}`}>
                      <Icon size={14} strokeWidth={1.75} />
                      {label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
        {!flats.loading && flats.data.length === 0 ? (
          <Link href={lp("/app/neu")} className="nav-item text-accent">
            <Plus size={14} strokeWidth={1.75} /> {t("Erste Wohnung anlegen", "Add your first flat")}
          </Link>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-line p-2">
        <Link href={lp("/app/abo")} className={`nav-item ${path === "/app/abo" ? "is-active" : ""}`}>
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-base-30 text-[11px] font-semibold text-ink">
            {(landlord.data?.name || user?.email || "?").slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-ink">{landlord.data?.name || user?.email}</span>
            <span className="block text-[11px] text-faint">
              {active
                ? sub?.status === "trialing"
                  ? t("Basic, Testphase", "Basic, free trial")
                  : "Basic"
                : t("Kein Abo", "No subscription")}
            </span>
          </span>
        </Link>
        <div className="mt-1 flex items-center justify-between pl-1.5">
          <LanguageSwitch source="app" />
          {/* The ribbon is desktop only, its bottom actions live here on phones. */}
          <div className="flex items-center gap-0.5 md:hidden">
            <Link href={lp("/#video")} className="icon-btn" aria-label={t("Hilfe", "Help")} title={t("Hilfe", "Help")}>
              <CircleHelp {...SMALL} />
            </Link>
            <FeedbackButton source="landlord" />
            <button
              type="button"
              className="icon-btn"
              onClick={signOutAndLeave}
              aria-label={t("Abmelden", "Sign out")}
              title={t("Abmelden", "Sign out")}
            >
              <LogOut {...SMALL} />
            </button>
          </div>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 px-1.5 pb-0.5 text-[11px] text-faint">
          {LEGAL_PAGES.map((page) => (
            <Link key={page.path} href={lp(page.path)} target="_blank" className="hover:text-muted">
              {t(page.de, page.en)}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );

  return (
    <ShellCtx.Provider
      value={{ landlord: landlord.data, flats: flats.data, flatsLoading: flats.loading, toggleSidebar }}
    >
      <div className="flex h-dvh overflow-hidden bg-bg">
        {/* Ribbon */}
        <aside className="hidden w-[44px] shrink-0 flex-col items-center gap-1 border-r border-line bg-bg-2 py-2 md:flex">
          <Link href={lp("/app")} className="mb-2 flex h-8 w-8 items-center justify-center text-ink" aria-label="Pairspace">
            <LogoMark size={20} />
          </Link>
          <button
            type="button"
            className="icon-btn h-8 w-8"
            onClick={toggleSidebar}
            aria-label={t("Seitenleiste", "Sidebar")}
            title={t("Seitenleiste", "Sidebar")}
          >
            <PanelLeft {...ICON} />
          </button>
          {currentFlatId ? (
            <>
              <Link
                href={lp(`/app/w/${currentFlatId}`)}
                className={`icon-btn h-8 w-8 ${path === `/app/w/${currentFlatId}` ? "is-active" : ""}`}
                aria-label={t("Bewerber Graph", "Applicant graph")}
                title={t("Bewerber Graph", "Applicant graph")}
              >
                <Waypoints {...ICON} />
              </Link>
              <Link
                href={lp(`/app/w/${currentFlatId}/zimmer`)}
                className={`icon-btn h-8 w-8 ${path.endsWith("/zimmer") ? "is-active" : ""}`}
                aria-label={t("Zimmer", "Rooms")}
                title={t("Zimmer", "Rooms")}
              >
                <BedDouble {...ICON} />
              </Link>
              <Link
                href={lp(`/app/w/${currentFlatId}/link`)}
                className={`icon-btn h-8 w-8 ${path.endsWith("/link") ? "is-active" : ""}`}
                aria-label={t("Einladungslink", "Invite link")}
                title={t("Einladungslink", "Invite link")}
              >
                <Link2 {...ICON} />
              </Link>
            </>
          ) : (
            <Link href={lp("/app")} className="icon-btn h-8 w-8" aria-label={t("Wohnungen", "Flats")} title={t("Wohnungen", "Flats")}>
              <House {...ICON} />
            </Link>
          )}
          <div className="flex-1" />
          <Link
            href={lp("/app/abo")}
            className={`icon-btn h-8 w-8 ${path === "/app/abo" ? "is-active" : ""}`}
            aria-label={t("Abo", "Subscription")}
            title={t("Abo", "Subscription")}
          >
            <CreditCard {...ICON} />
          </Link>
          <Link href={lp("/#video")} className="icon-btn h-8 w-8" aria-label={t("Hilfe", "Help")} title={t("Hilfe", "Help")}>
            <CircleHelp {...ICON} />
          </Link>
          <FeedbackButton source="landlord" className="h-8 w-8" />
          <button
            type="button"
            className="icon-btn h-8 w-8"
            onClick={signOutAndLeave}
            aria-label={t("Abmelden", "Sign out")}
            title={t("Abmelden", "Sign out")}
          >
            <LogOut {...ICON} />
          </button>
        </aside>

        {/* Sidebar, desktop */}
        {sidebarOpen ? <div className="hidden shrink-0 border-r border-line md:block">{sidebar}</div> : null}

        {/* Sidebar, mobile drawer */}
        {mobileOpen ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
              aria-label={t("Schließen", "Close")}
            />
            <div className="relative h-full w-[260px] border-r border-line shadow-2xl">{sidebar}</div>
          </div>
        ) : null}

        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </ShellCtx.Provider>
  );
}

/**
 * Obsidian's tab header plus view header: one active tab with the view's icon
 * and title, actions on the right.
 */
export function PaneHeader({
  icon: Icon,
  title,
  actions,
}: {
  icon: typeof Waypoints;
  title: string;
  actions?: ReactNode;
}) {
  const { toggleSidebar } = useShell();
  const t = useT();
  return (
    <header className="flex h-10 shrink-0 items-end gap-1 border-b border-line bg-bg-2 px-2">
      <button type="button" className="icon-btn mb-1.5 md:hidden" onClick={toggleSidebar} aria-label={t("Seitenleiste", "Sidebar")}>
        <PanelLeft {...SMALL} />
      </button>
      <div className="relative -mb-px flex h-8 min-w-0 max-w-[280px] items-center gap-2 rounded-t-lg border border-b-0 border-line bg-bg px-3 text-ui-small text-ink">
        <Icon size={14} strokeWidth={1.75} className="shrink-0 text-muted" />
        <span className="truncate">{title}</span>
      </div>
      <div className="flex-1" />
      <div className="mb-1.5 flex items-center gap-1">{actions}</div>
    </header>
  );
}

/** Scrollable reading pane with Obsidian's readable line width. */
export function PaneBody({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className={`mx-auto w-full px-5 pb-24 pt-8 md:px-8 ${wide ? "max-w-[980px]" : "max-w-[700px]"}`}>{children}</div>
    </div>
  );
}
