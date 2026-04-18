'use client';

// Dashboard shell — sidebar nawigacja (desktop + mobile drawer) + topbar.
// Ten komponent jest client side, bo ma interaktywny mobile drawer
// i SignOutButton (next-auth/react).

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Map as MapIcon,
  Sprout,
  Bot,
  Settings,
  Menu,
  X,
  LogOut,
  Home,
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
  { href: '/dashboard/agent', label: 'Agent', icon: Bot },
  { href: '/dashboard/settings', label: 'Ustawienia', icon: Settings },
];

export function DashboardShell({ farm, user, children }: DashboardShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-green-50 to-white">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-60 border-r border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="h-16 flex items-center gap-2 px-4 border-b border-gray-200">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">Ag</span>
          </div>
          <span className="font-bold text-gray-900">AgriClaw</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href, link.exact);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition',
                  active
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-700 hover:bg-gray-100',
                )}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-gray-200 p-3 space-y-2">
          <div className="px-2">
            <div className="text-xs text-gray-500">Zalogowany jako</div>
            <div className="text-sm font-medium text-gray-900 truncate">
              {user.name || user.email}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
          >
            <LogOut className="w-4 h-4" />
            Wyloguj
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-30"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="md:hidden fixed top-0 left-0 bottom-0 w-64 bg-white z-40 shadow-xl flex flex-col">
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Ag</span>
                </div>
                <span className="font-bold text-gray-900">AgriClaw</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-md text-gray-500 hover:bg-gray-100"
                aria-label="Zamknij menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href, link.exact);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition',
                      active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-gray-700 hover:bg-gray-100',
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-gray-200 p-3 space-y-2">
              <div className="px-2">
                <div className="text-xs text-gray-500">Zalogowany jako</div>
                <div className="text-sm font-medium text-gray-900 truncate">
                  {user.name || user.email}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
              >
                <LogOut className="w-4 h-4" />
                Wyloguj
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-sm flex items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden p-1 rounded-md text-gray-500 hover:bg-gray-100"
            aria-label="Otwórz menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <MapIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">
                {farm.name}
              </div>
              <div className="text-xs text-gray-500 truncate">{farm.address}</div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
