"use client";

import {
  BedDouble,
  Check,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  CreditCard,
  House,
  Link2,
  LogOut,
  Menu,
  Plus,
  Settings,
  Waypoints,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { FeedbackButton } from "@/components/feedback/Feedback";
import { LanguageSwitch } from "@/components/site/LanguageSwitch";
import { LogoMark } from "@/components/ui/Logo";
import { useAuth } from "@/lib/firebase/auth";
import { useLandlord, useMyFlats } from "@/lib/firebase/data";
import { basePath, type T } from "@/lib/i18n";
import { useLocalePath, useT } from "@/lib/i18n/client";
import { LEGAL_PAGES } from "@/lib/legal";
import { isActive } from "@/lib/plans";
import type { Flat, Landlord, Subscription } from "@/lib/types";

const NAV = { size: 16, strokeWidth: 1.75 } as const;
const SMALL = { size: 15, strokeWidth: 1.75 } as const;

/** Per browser conveniences, the app works the same without them. */
const COLLAPSED_KEY = "pairspace:sidebar-collapsed";
const LAST_FLAT_KEY = "pairspace:last-flat";

function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function store(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage, nothing to remember then.
  }
}

interface ShellState {
  landlord: Landlord | null;
  landlordLoading: boolean;
  flats: Flat[];
  flatsLoading: boolean;
  /** The flat in the switcher: the one in the address, otherwise the one opened last. */
  selectedFlat: Flat | null;
  openMobileNav: () => void;
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

function planLabel(sub: Subscription | undefined, t: T): string {
  if (!isActive(sub)) return t("Kein Abo", "No plan");
  return sub?.status === "trialing" ? t("Testphase", "Free trial") : "Basic";
}

/** Closes a menu on a click outside of `ref` or on Escape. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) closeRef.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return ref;
}

/**
 * Laid out like the Firebase console: one sidebar that collapses to icons,
 * a top bar with the flat switcher and the account menu, the page below.
 * The sidebar always shows the views of the selected flat.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const t = useT();
  const pathname = usePathname();
  // The current view without /en, so it compares with the plain paths.
  const path = basePath(pathname);
  const landlord = useLandlord(user?.uid);
  const flats = useMyFlats(user?.uid);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastFlatId, setLastFlatId] = useState<string | null>(null);

  const routeFlatId = path.match(/^\/app\/w\/([^/]+)/)?.[1] ?? null;

  useEffect(() => {
    setCollapsed(readStored(COLLAPSED_KEY) === "1");
    setLastFlatId(readStored(LAST_FLAT_KEY));
  }, []);

  useEffect(() => {
    if (!routeFlatId) return;
    setLastFlatId(routeFlatId);
    store(LAST_FLAT_KEY, routeFlatId);
  }, [routeFlatId]);

  useEffect(() => setMobileOpen(false), [pathname]);

  const selectedFlat = routeFlatId
    ? (flats.data.find((f) => f.id === routeFlatId) ?? null)
    : (flats.data.find((f) => f.id === lastFlatId) ?? flats.data[0] ?? null);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      store(COLLAPSED_KEY, c ? "0" : "1");
      return !c;
    });
  };

  return (
    <ShellCtx.Provider
      value={{
        landlord: landlord.data,
        landlordLoading: landlord.loading,
        flats: flats.data,
        flatsLoading: flats.loading,
        selectedFlat,
        openMobileNav: () => setMobileOpen(true),
      }}
    >
      <div className="flex h-dvh overflow-hidden bg-bg">
        <div className="hidden shrink-0 border-r border-line md:block">
          <Sidebar path={path} flatId={routeFlatId ?? selectedFlat?.id ?? null} collapsed={collapsed} onToggle={toggleCollapsed} />
        </div>

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
              aria-label={t("Schließen", "Close")}
            />
            <div className="relative h-full w-[260px] border-r border-line shadow-2xl">
              <Sidebar path={path} flatId={routeFlatId ?? selectedFlat?.id ?? null} onClose={() => setMobileOpen(false)} />
            </div>
          </div>
        ) : null}

        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </ShellCtx.Provider>
  );
}

function Sidebar({
  path,
  flatId,
  collapsed = false,
  onToggle,
  onClose,
}: {
  path: string;
  flatId: string | null;
  collapsed?: boolean;
  /** Desktop: collapse to icons and back. */
  onToggle?: () => void;
  /** Phone drawer: close it. */
  onClose?: () => void;
}) {
  const { landlord, flatsLoading } = useShell();
  const t = useT();
  const lp = useLocalePath();

  const row = (href: string, label: string, Icon: typeof Waypoints, extra?: ReactNode) => (
    <Link
      key={href}
      href={lp(href)}
      className={`nav-item min-h-8 ${path === href ? "is-active" : ""} ${collapsed ? "justify-center px-0" : ""}`}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
    >
      <Icon {...NAV} className="shrink-0" />
      {collapsed ? null : (
        <>
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {extra}
        </>
      )}
    </Link>
  );

  return (
    <nav
      className={`flex h-full flex-col bg-bg-2 transition-[width] duration-150 ${collapsed ? "w-[52px]" : "w-[240px]"}`}
      aria-label="Pairspace"
    >
      <div className={`flex h-12 shrink-0 items-center ${collapsed ? "justify-center" : "justify-between px-4"}`}>
        <Link href={lp("/app")} className="flex items-center gap-2.5 text-ink" aria-label="Pairspace">
          <LogoMark size={22} />
          {collapsed ? null : <span className="text-[15px] font-semibold tracking-[-0.01em]">Pairspace</span>}
        </Link>
        {onClose ? (
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t("Schließen", "Close")}>
            <X {...SMALL} />
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-2">
        <div className="flex flex-col gap-0.5">
          {flatId
            ? flatLinks(flatId, t).map(({ href, label, icon }) => row(href, label, icon))
            : flatsLoading
              ? null
              : row("/app/neu", t("Erste Wohnung anlegen", "Add your first flat"), Plus)}
        </div>
        <div className="mx-2 my-3 border-t border-line" />
        <div className="flex flex-col gap-0.5">
          {row(
            "/app/abo",
            t("Abo", "Subscription"),
            CreditCard,
            <span className="text-[11px] text-faint">{planLabel(landlord?.subscription, t)}</span>,
          )}
          {row("/#video", t("Hilfe", "Help"), CircleHelp)}
          <FeedbackButton source="landlord" variant={collapsed ? "nav-collapsed" : "nav"} className="min-h-8" />
        </div>
      </div>

      <div className="shrink-0 border-t border-line p-2">
        {collapsed ? null : (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 px-2 pb-2 pt-1 text-[11px] text-faint">
            {LEGAL_PAGES.map((page) => (
              <Link key={page.path} href={lp(page.path)} target="_blank" className="hover:text-muted">
                {t(page.de, page.en)}
              </Link>
            ))}
          </div>
        )}
        {onToggle ? (
          <div className={`flex ${collapsed ? "justify-center" : "justify-end"}`}>
            <button
              type="button"
              className="icon-btn"
              onClick={onToggle}
              aria-label={collapsed ? t("Seitenleiste ausklappen", "Expand sidebar") : t("Seitenleiste einklappen", "Collapse sidebar")}
              title={collapsed ? t("Ausklappen", "Expand") : t("Einklappen", "Collapse")}
            >
              {collapsed ? <ChevronsRight {...SMALL} /> : <ChevronsLeft {...SMALL} />}
            </button>
          </div>
        ) : null}
      </div>
    </nav>
  );
}

function FlatStatus({ flat }: { flat: Flat }) {
  const t = useT();
  if (flat.status === "live") return null;
  return (
    <span className="shrink-0 rounded-sm bg-base-30 px-1.5 text-[11px] font-normal text-faint">
      {flat.status === "draft" ? t("Entwurf", "Draft") : t("Pausiert", "Paused")}
    </span>
  );
}

/** Firebase's project picker: which flat the sidebar and the page are about. */
function FlatSwitcher() {
  const { flats, selectedFlat } = useShell();
  const t = useT();
  const lp = useLocalePath();
  const path = basePath(usePathname());
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  // Switching keeps the view, the way Firebase keeps the product when the project changes.
  const view = path.match(/^\/app\/w\/[^/]+(\/(?:zimmer|link|einstellungen))$/)?.[1] ?? "";
  const name = (flat: Flat) => flat.title || t("Neue Wohnung", "New flat");

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        className="flex h-8 min-w-0 max-w-full items-center gap-2 rounded-md px-2 text-ui-small font-medium text-ink transition-colors hover:bg-[var(--hover)]"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <House {...SMALL} className="shrink-0 text-faint" />
        <span className="truncate">{selectedFlat ? name(selectedFlat) : t("Wohnung wählen", "Choose a flat")}</span>
        {selectedFlat ? <FlatStatus flat={selectedFlat} /> : null}
        <ChevronDown size={14} strokeWidth={1.75} className="shrink-0 text-faint" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-full z-30 mt-1 w-[min(300px,calc(100vw-24px))] rounded-lg border border-line bg-bg-2 p-1 shadow-[var(--shadow-l)]"
        >
          <div className="ui-label px-2 pb-1 pt-1.5">{t("Deine Wohnungen", "Your flats")}</div>
          <div className="max-h-[50vh] overflow-y-auto">
            {flats.map((flat) => (
              <Link
                key={flat.id}
                role="menuitem"
                href={lp(`/app/w/${flat.id}${view}`)}
                onClick={() => setOpen(false)}
                className={`nav-item min-h-8 ${flat.id === selectedFlat?.id ? "text-ink" : ""}`}
              >
                <span className="min-w-0 flex-1 truncate">{name(flat)}</span>
                <FlatStatus flat={flat} />
                <Check {...SMALL} className={`shrink-0 text-accent ${flat.id === selectedFlat?.id ? "" : "invisible"}`} />
              </Link>
            ))}
          </div>
          <div className="mx-1 my-1 border-t border-line" />
          <Link role="menuitem" href={lp("/app/neu")} onClick={() => setOpen(false)} className="nav-item min-h-8">
            <Plus {...SMALL} className="shrink-0" />
            {t("Neue Wohnung", "New flat")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

/** The account in the top right, like the avatar in the Firebase console. */
function AccountMenu() {
  const { user, signOut } = useAuth();
  const { landlord } = useShell();
  const router = useRouter();
  const t = useT();
  const lp = useLocalePath();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const name = landlord?.name || user?.displayName || user?.email || "";

  const signOutAndLeave = async () => {
    await signOut();
    router.replace(lp("/"));
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-base-30 text-[12px] font-semibold text-ink ring-accent-line transition hover:ring-2"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("Konto", "Account")}
        title={name}
      >
        {(name || "?").slice(0, 1).toUpperCase()}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-[min(280px,calc(100vw-24px))] rounded-lg border border-line bg-bg-2 p-1 shadow-[var(--shadow-l)]"
        >
          <div className="px-2 pb-2 pt-1.5">
            <div className="truncate text-ui-small font-medium text-ink">{landlord?.name || user?.displayName || name}</div>
            {user?.email ? <div className="truncate text-[12px] text-faint">{user.email}</div> : null}
          </div>
          <Link role="menuitem" href={lp("/app/abo")} onClick={() => setOpen(false)} className="nav-item min-h-8">
            <CreditCard {...SMALL} className="shrink-0" />
            <span className="flex-1">{t("Abo", "Subscription")}</span>
            <span className="text-[11px] text-faint">{planLabel(landlord?.subscription, t)}</span>
          </Link>
          <div className="px-2 py-1">
            <LanguageSwitch source="app" />
          </div>
          <div className="mx-1 my-1 border-t border-line" />
          <button type="button" role="menuitem" onClick={signOutAndLeave} className="nav-item min-h-8 w-full text-left">
            <LogOut {...SMALL} className="shrink-0" />
            {t("Abmelden", "Sign out")}
          </button>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 px-2 pb-1 pt-2 text-[11px] text-faint">
            {LEGAL_PAGES.map((page) => (
              <Link key={page.path} href={lp(page.path)} target="_blank" className="hover:text-muted">
                {t(page.de, page.en)}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** The top bar of every page: menu on phones, flat switcher, the page's actions, account. */
export function PaneHeader({ actions }: { actions?: ReactNode }) {
  const { openMobileNav } = useShell();
  const t = useT();
  return (
    <header className="flex h-12 shrink-0 items-center gap-1 border-b border-line bg-bg px-2 md:px-3">
      <button type="button" className="icon-btn shrink-0 md:hidden" onClick={openMobileNav} aria-label={t("Menü", "Menu")}>
        <Menu {...SMALL} />
      </button>
      <FlatSwitcher />
      <div className="flex-1" />
      {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
      <AccountMenu />
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
