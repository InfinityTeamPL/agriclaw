'use client';

// Dashboard shell — sidebar nawigacja (desktop + mobile drawer) + topbar.
// Design system „stacja naziemna": płaskie tokeny, collapsible sidebar, profile menu.

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Map as MapIcon,
  Sprout,
  Bot,
  BookOpen,
  Camera,
  Flower2,
  MapPin,
  Settings,
  Menu,
  X,
  LogOut,
  Home,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Bell,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NdviKeyline } from '@/components/brand/NdviKeyline';
import { LogoMark } from '@/components/brand/LogoMark';
import { UserAvatar } from '@/components/brand/UserAvatar';
import { TopbarSlotProvider, TopbarSlotTarget } from '@/components/dashboard/TopbarSlot';

interface DashboardShellProps {
  farm: { id: string; name: string; address: string };
  user: { email: string; name: string | null };
  children: React.ReactNode;
}

interface NavLink {
  href: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
}

// Grupy zamiast płaskiej listy 9 pozycji — rolnik szuka „czegoś do dokumentów" lub
// „czegoś do diagnozy", nie „pozycji nr 6". Etykiety grup znikają przy zwiniętym menu.
const navGroups: Array<{ label: string; links: NavLink[] }> = [
  {
    label: 'Gospodarstwo',
    links: [
      { href: '/dashboard', label: 'Panel', icon: Home, exact: true },
      { href: '/dashboard/fields', label: 'Moje pola', icon: Sprout },
      { href: '/dashboard/scouting', label: 'Obserwacje', icon: MapPin },
    ],
  },
  {
    label: 'Dokumenty',
    links: [
      { href: '/dashboard/journal', label: 'Księga polowa', icon: BookOpen },
      { href: '/dashboard/compliance', label: 'Zgodność ARiMR', icon: ShieldCheck },
    ],
  },
  {
    label: 'Narzędzia',
    links: [
      { href: '/dashboard/diagnose', label: 'Diagnoza z kamery', icon: Camera },
      { href: '/dashboard/houseplants', label: 'Rośliny domowe', icon: Flower2 },
      { href: '/dashboard/agent', label: 'AgroAgent', icon: Bot },
    ],
  },
  { label: 'Konto', links: [{ href: '/dashboard/settings', label: 'Ustawienia', icon: Settings }] },
];

// Dolny pasek na telefonie — 5 najczęstszych celów w zasięgu kciuka (reszta w menu).
const tabLinks: Array<NavLink & { short: string }> = [
  { href: '/dashboard', label: 'Panel', short: 'Panel', icon: Home, exact: true },
  { href: '/dashboard/fields', label: 'Moje pola', short: 'Pola', icon: Sprout },
  { href: '/dashboard/diagnose', label: 'Diagnoza z kamery', short: 'Diagnoza', icon: Camera },
  { href: '/dashboard/journal', label: 'Księga polowa', short: 'Księga', icon: BookOpen },
  { href: '/dashboard/agent', label: 'AgroAgent', short: 'Agent', icon: Bot },
];

function NavList({
  isActive,
  collapsed = false,
  large = false,
  onNavigate,
}: {
  isActive: (href: string, exact?: boolean) => boolean;
  collapsed?: boolean;
  large?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-5">
      {navGroups.map((group) => (
        <div key={group.label}>
          {collapsed ? (
            <div className="mx-3 mb-2 h-px bg-border first:hidden" aria-hidden="true" />
          ) : (
            <div className="hud-label px-3 pb-1.5">{group.label}</div>
          )}
          <div className="space-y-0.5">
            {group.links.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href, link.exact);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onNavigate}
                  title={collapsed ? link.label : undefined}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-150',
                    large ? 'py-3' : 'py-2',
                    active
                      ? 'bg-primary/10 text-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-[18px] w-[18px] shrink-0 transition-colors',
                      active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                    )}
                  />
                  {!collapsed && <span className="truncate">{link.label}</span>}
                  {active && !collapsed && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardShell({ farm, user, children }: DashboardShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const profileRef = useRef<HTMLDivElement | null>(null);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const handleSignOut = () => {
    // Wyczyść cache SW z ewentualnych pozostałości przed wylogowaniem —
    // chroni dane gospodarstwa na współdzielonym urządzeniu.
    try {
      navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_RUNTIME_CACHE' });
    } catch {
      /* SW niedostępny — nic nie szkodzi */
    }
    signOut({ callbackUrl: '/' });
  };

  // Close profile menu on outside click
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  // Restore collapsed state
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('agri.sidebar.collapsed') : null;
    if (saved === '1') setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('agri.sidebar.collapsed', next ? '1' : '0');
      }
      return next;
    });
  };

  return (
    // h-dvh (nie min-h-screen): main dostaje SKOŃCZONĄ wysokość — strony
    // scrollują wewnątrz main, a instrumenty pełnoekranowe (czat) używają
    // h-full/flex-1 bez rozpychania layoutu. dvh = poprawny viewport mobile.
    <TopbarSlotProvider>
    <div className="h-dvh flex bg-background relative">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'relative z-10 hidden md:flex md:flex-col border-r border-border bg-card transition-[width] duration-300 ease-out',
          collapsed ? 'md:w-[76px]' : 'md:w-64',
        )}
      >
        {/* Sygnatura: keyline rampy NDVI na górze paska bocznego */}
        <NdviKeyline height={3} rounded={false} />
        <div className="h-16 flex items-center gap-3 px-4 border-b border-border">
          <LogoMark size={36} />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="font-display font-semibold text-foreground tracking-tight">AgriClaw</div>
              <div className="hud-label">Cyfrowy agronom</div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Główna nawigacja">
          <NavList isActive={isActive} collapsed={collapsed} />
        </nav>

        <div className="border-t border-border p-3 space-y-2">
          <button
            onClick={toggleCollapsed}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition"
            aria-label={collapsed ? 'Rozwiń menu' : 'Zwiń menu'}
          >
            {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
            {!collapsed && <span>Zwiń menu</span>}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-foreground/40 z-30"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-72 bg-card z-40 shadow-pop flex flex-col border-r border-border"
            >
              {/* Sygnatura: keyline rampy NDVI — jak w desktopowym sidebarze */}
              <NdviKeyline height={3} rounded={false} />
              <div className="h-16 flex items-center justify-between px-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <LogoMark size={36} />
                  <div>
                    <div className="font-display font-semibold text-foreground tracking-tight">AgriClaw</div>
                    <div className="hud-label">Cyfrowy agronom</div>
                  </div>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary"
                  aria-label="Zamknij menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Główna nawigacja">
                <NavList isActive={isActive} large onNavigate={() => setDrawerOpen(false)} />
              </nav>
              <div className="border-t border-border p-4 space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border">
                  <UserAvatar name={user.name} email={user.email} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">
                      {user.name || user.email}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{farm.name}</div>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full inline-flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-foreground hover:bg-secondary transition"
                >
                  <LogOut className="w-4 h-4" />
                  Wyloguj
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="sticky top-0 z-20 h-16 border-b border-border bg-card flex items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden p-2 rounded-md text-muted-foreground hover:bg-secondary"
            aria-label="Otwórz menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Farm switcher */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="hidden sm:flex w-9 h-9 rounded-md bg-secondary border border-border items-center justify-center shrink-0">
              <MapIcon className="w-4 h-4 text-signal-healthy" />
            </div>
            <div className="min-w-0">
              <div className="hud-label">
                Gospodarstwo
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{farm.name}</div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </div>
            </div>
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-2">
            {/* Slot na kontrolki strony (np. selektor silnika na /dashboard/agent) */}
            <TopbarSlotTarget className="flex items-center" />

            <Link
              href="/dashboard"
              className="hidden sm:inline-flex relative items-center justify-center w-10 h-10 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition"
              aria-label="Alerty i pilne sygnały"
              title="Alerty i pilne sygnały"
            >
              <Bell className="w-[18px] h-[18px]" />
            </Link>

            {/* Profile menu */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-md hover:bg-secondary transition"
              >
                <UserAvatar name={user.name} email={user.email} size={32} />
                <span className="hidden sm:inline text-sm font-medium text-foreground max-w-[140px] truncate">
                  {user.name || user.email.split('@')[0]}
                </span>
                <ChevronDown className={cn('hidden sm:block w-4 h-4 text-muted-foreground transition-transform', profileOpen && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 top-full mt-2 w-64 rounded-lg bg-card border border-border shadow-pop overflow-hidden"
                  >
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                      <UserAvatar name={user.name} email={user.email} size={40} />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">
                          {user.name || user.email}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                      </div>
                    </div>
                    <div className="p-1.5">
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-foreground hover:bg-secondary transition"
                      >
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        Ustawienia
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-foreground hover:bg-destructive/10 hover:text-destructive transition"
                      >
                        <LogOut className="w-4 h-4 text-muted-foreground" />
                        Wyloguj się
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>

        {/* Dolny pasek (tylko telefon): 5 głównych celów w zasięgu kciuka */}
        <nav
          aria-label="Szybka nawigacja"
          className="md:hidden shrink-0 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]"
        >
          <ul className="grid grid-cols-5">
            {tabLinks.map((t) => {
              const Icon = t.icon;
              const active = isActive(t.href, t.exact);
              return (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    aria-current={active ? 'page' : undefined}
                    aria-label={t.label}
                    className={cn(
                      'flex flex-col items-center gap-0.5 pt-1.5 pb-1.5 text-[10px] font-medium transition-colors',
                      active ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                        active && 'bg-primary/10',
                      )}
                    >
                      <Icon className={cn('h-5 w-5', active && 'text-primary')} />
                    </span>
                    {t.short}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
    </TopbarSlotProvider>
  );
}
