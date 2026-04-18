'use client';

// Dashboard shell — sidebar nawigacja (desktop + mobile drawer) + topbar.
// Glass morphism, collapsible sidebar, animowane hover stany, profile menu.

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

interface DashboardShellProps {
  farm: { id: string; name: string; address: string };
  user: { email: string; name: string | null };
  children: React.ReactNode;
}

const navLinks = [
  { href: '/dashboard', label: 'Panel', icon: Home, exact: true },
  { href: '/dashboard/fields', label: 'Moje pola', icon: Sprout },
  { href: '/dashboard/scouting', label: 'Obserwacje', icon: MapPin },
  { href: '/dashboard/journal', label: 'Księga polowa', icon: BookOpen },
  { href: '/dashboard/compliance', label: 'Zgodność ARiMR', icon: ShieldCheck },
  { href: '/dashboard/diagnose', label: 'Diagnoza z kamery', icon: Camera },
  { href: '/dashboard/agent', label: 'AgroAgent', icon: Bot },
  { href: '/dashboard/settings', label: 'Ustawienia', icon: Settings },
];

export function DashboardShell({ farm, user, children }: DashboardShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const profileRef = useRef<HTMLDivElement | null>(null);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const handleSignOut = () => {
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

  const initials = (user.name || user.email)
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || 'AG';

  return (
    <div className="min-h-screen flex bg-[#f4f7f3] relative overflow-hidden">
      {/* Ambient gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-[480px] h-[480px] rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[420px] h-[420px] rounded-full bg-lime-200/30 blur-3xl" />
      </div>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'relative z-10 hidden md:flex md:flex-col border-r border-white/40 bg-white/55 backdrop-blur-xl transition-[width] duration-300 ease-out',
          collapsed ? 'md:w-[76px]' : 'md:w-64',
        )}
      >
        <div className="h-16 flex items-center gap-3 px-4 border-b border-white/50">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-[0_8px_24px_-6px_rgba(16,185,129,0.55)] flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent" />
            <span className="relative text-white font-semibold tracking-tight text-sm">Ag</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 tracking-tight">AgriClaw</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-700/80">Cyfrowy agronom</div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href, link.exact);
            return (
              <Link
                key={link.href}
                href={link.href}
                title={collapsed ? link.label : undefined}
                className={cn(
                  'group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-[0_10px_25px_-10px_rgba(16,185,129,0.8)]'
                    : 'text-gray-700 hover:bg-white/70 hover:text-emerald-700 hover:shadow-sm',
                )}
              >
                <Icon className={cn('w-[18px] h-[18px] shrink-0', active ? 'text-white' : 'text-gray-500 group-hover:text-emerald-600')} />
                {!collapsed && <span className="truncate">{link.label}</span>}
                {active && !collapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" aria-hidden="true" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/50 p-3 space-y-2">
          <button
            onClick={toggleCollapsed}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-2xl text-xs font-medium text-gray-500 hover:bg-white/70 hover:text-emerald-700 transition"
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
              className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-72 bg-white/95 backdrop-blur-xl z-40 shadow-2xl flex flex-col border-r border-white/50"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-lg flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">Ag</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 tracking-tight">AgriClaw</div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-700/80">Cyfrowy agronom</div>
                  </div>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-xl text-gray-500 hover:bg-gray-100"
                  aria-label="Zamknij menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href, link.exact);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setDrawerOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium transition',
                        active
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100',
                      )}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-gray-200/60 p-4 space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {user.name || user.email}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{farm.name}</div>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full inline-flex items-center gap-2 px-3 py-2.5 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
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
        <header className="sticky top-0 z-20 h-16 border-b border-white/40 bg-white/60 backdrop-blur-xl flex items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-white/70"
            aria-label="Otwórz menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Farm switcher */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="hidden sm:flex w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-50 to-lime-50 border border-emerald-100 items-center justify-center shrink-0">
              <MapIcon className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.18em] text-gray-400 font-medium">
                Gospodarstwo
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{farm.name}</div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              </div>
            </div>
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="hidden sm:inline-flex relative items-center justify-center w-10 h-10 rounded-2xl text-gray-600 hover:bg-white/70 hover:text-emerald-700 transition"
              aria-label="Powiadomienia"
            >
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </button>

            {/* Profile menu */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-2xl hover:bg-white/70 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-xs">
                  {initials}
                </div>
                <span className="hidden sm:inline text-sm font-medium text-gray-700 max-w-[140px] truncate">
                  {user.name || user.email.split('@')[0]}
                </span>
                <ChevronDown className={cn('hidden sm:block w-4 h-4 text-gray-400 transition-transform', profileOpen && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white/95 backdrop-blur-xl border border-gray-200/70 shadow-2xl overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {user.name || user.email}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{user.email}</div>
                    </div>
                    <div className="p-1.5">
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition"
                      >
                        <Settings className="w-4 h-4 text-gray-500" />
                        Ustawienia
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition"
                      >
                        <LogOut className="w-4 h-4 text-gray-500" />
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
      </div>
    </div>
  );
}
