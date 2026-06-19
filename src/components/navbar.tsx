"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Gauge,
  FileText,
  ClipboardList,
  Users,
  Glasses,
  LineChart,
  ChevronDown,
  LogOut,
  Settings,
} from "lucide-react";
import { LensMark } from "@/components/lens-mark";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/painel", label: "Painel", icon: Gauge },
  { href: "/orcamentos", label: "Orçamentos", icon: FileText },
  { href: "/os", label: "OS", icon: ClipboardList },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/produtos", label: "Produtos", icon: Glasses },
  { href: "/financeiro", label: "Financeiro", icon: LineChart },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const userLabel =
    (session?.user.user_metadata?.full_name as string | undefined) ||
    session?.user.email?.split("@")[0] ||
    "admin";

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 bg-garnet-gradient shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/painel" className="flex items-center gap-2.5 shrink-0">
          <LensMark className="h-6 w-10 text-white" />
          <span className="font-display text-lg font-bold tracking-tight text-white">
            Ótica<span className="font-normal text-white/70">OS</span>
          </span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 overflow-x-auto md:flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition",
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white/90 transition hover:bg-white/10"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-semibold uppercase">
              {userLabel.slice(0, 2)}
            </span>
            <span className="hidden sm:inline">Olá, {userLabel}</span>
            <ChevronDown size={14} />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-sand-200 bg-white py-1 shadow-card">
                <button
                  disabled
                  className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-ink-300"
                >
                  <Settings size={15} /> Configurações
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-garnet-600 hover:bg-garnet-50"
                >
                  <LogOut size={15} /> Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* nav mobile */}
      <nav className="flex gap-1 overflow-x-auto border-t border-white/10 px-3 py-2 md:hidden">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium",
                active ? "bg-white/15 text-white" : "text-white/70"
              )}
            >
              <Icon size={14} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
