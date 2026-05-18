"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cambiaIdentita } from "@/lib/auth/actions";
import { EVENTO_TABS, extractEventoId } from "@/lib/evento-tabs";

export type EventoLink = {
  id: string;
  nome: string;
  data_inizio: string;
};

type NavItem = { href: string; label: string };
type NavGroup = { label: string; children: NavItem[] };
type NavLink = NavItem | NavGroup;

const SCOUTING_CHILDREN: NavItem[] = [
  { href: "/artisti", label: "Artisti" },
  { href: "/locations", label: "Location" },
  { href: "/sponsor", label: "Sponsor" },
  { href: "/personale", label: "Staff" },
];

const NAV_LINKS: NavLink[] = [
  { href: "/eventi", label: "Eventi" },
  { href: "/calendario", label: "Calendario" },
  { label: "Scouting", children: SCOUTING_CHILDREN },
  { href: "/conto", label: "Conto" },
  { href: "/inventario", label: "Inventario" },
];

function isGroup(link: NavLink): link is NavGroup {
  return "children" in link;
}

type Props = {
  identityName: string;
  eventi: EventoLink[];
  children: React.ReactNode;
};

export function AppShell({ identityName, eventi, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const eventoId = extractEventoId(pathname);

  // Quando entro in un evento, forzo l'apertura del menu Eventi
  // così vedo subito tutte le sue sottocategorie.
  useEffect(() => {
    if (eventoId) {
      setOpenGroups((prev) =>
        prev.Eventi ? prev : { ...prev, Eventi: true },
      );
    }
  }, [eventoId]);

  // Home page: rendering a tutta pagina senza sidebar né header.
  if (pathname === "/") {
    return <>{children}</>;
  }

  function toggleGroup(label: string, autoOpen: boolean) {
    setOpenGroups((prev) => {
      const current = prev[label] ?? autoOpen;
      return { ...prev, [label]: !current };
    });
  }

  function isGroupOpen(label: string, autoOpen: boolean): boolean {
    return openGroups[label] ?? autoOpen;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-neutral-800 bg-neutral-50">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-white">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Apri menu"
          className="p-2 -ml-2 text-neutral-800"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <Link href="/" className="font-medium text-neutral-900">
          Team Matazz
        </Link>
        <div className="w-8" />
      </div>

      {sidebarOpen && (
        <button
          aria-label="Chiudi menu"
          className="md:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed md:sticky top-0 left-0 z-40 w-60 h-screen
          bg-white border-r border-neutral-200
          flex flex-col
          transition-transform md:transition-none
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="px-4 py-4 border-b border-neutral-200">
          <Link
            href="/"
            onClick={() => setSidebarOpen(false)}
            className="text-lg font-medium text-neutral-900"
          >
            Team Matazz
          </Link>
        </div>
        <nav className="flex-1 p-2 overflow-y-auto">
          <ul className="space-y-1">
            {NAV_LINKS.map((link) => {
              if (isGroup(link)) {
                const childActive = link.children.some(
                  (c) =>
                    pathname === c.href || pathname.startsWith(c.href + "/"),
                );
                const open = isGroupOpen(link.label, childActive);
                return (
                  <li key={link.label}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(link.label, childActive)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded text-sm ${
                        childActive
                          ? "bg-amber-100 text-amber-800 font-medium"
                          : "text-neutral-800 hover:bg-neutral-100"
                      }`}
                    >
                      <span>{link.label}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {open && (
                      <ul className="mt-1 ml-6 space-y-0.5 border-l border-neutral-200 pl-3">
                        {link.children.map((c) => {
                          const cActive =
                            pathname === c.href ||
                            pathname.startsWith(c.href + "/");
                          return (
                            <li key={c.href}>
                              <Link
                                href={c.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`block px-3 py-1.5 rounded text-sm ${
                                  cActive
                                    ? "bg-amber-50 text-amber-800 font-medium"
                                    : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                                }`}
                              >
                                {c.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              const isActive =
                pathname === link.href || pathname.startsWith(link.href + "/");
              const isEventiLink = link.href === "/eventi";
              const eventiOpen = isEventiLink
                ? isGroupOpen("Eventi", isActive)
                : false;

              return (
                <li key={link.href}>
                  <div
                    className={`flex items-center rounded text-sm ${
                      isActive
                        ? "bg-amber-100 text-amber-800 font-medium"
                        : "text-neutral-800 hover:bg-neutral-100"
                    }`}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setSidebarOpen(false)}
                      className="flex-1 px-3 py-2"
                    >
                      {link.label}
                    </Link>
                    {isEventiLink && (
                      <button
                        type="button"
                        onClick={() => toggleGroup("Eventi", isActive)}
                        aria-label={
                          eventiOpen ? "Chiudi menu eventi" : "Apri menu eventi"
                        }
                        className="px-2 py-2 text-current hover:text-neutral-900"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            eventiOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Sub-menu Eventi: sempre la lista di tutti gli eventi.
                      Per quello attualmente aperto, tab nestati sotto. */}
                  {isEventiLink && eventiOpen && eventi.length > 0 && (
                    <ul className="mt-1 ml-6 space-y-0.5 border-l border-neutral-200 pl-3">
                      {eventi.map((e) => {
                        const eventoActive = eventoId === e.id;
                        return (
                          <li key={e.id}>
                            <Link
                              href={`/eventi/${e.id}`}
                              onClick={() => setSidebarOpen(false)}
                              className={`block px-3 py-1.5 rounded text-sm truncate ${
                                eventoActive
                                  ? "text-neutral-900 font-medium"
                                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                              }`}
                            >
                              {e.nome}
                            </Link>
                            {eventoActive && (
                              <ul className="mt-0.5 ml-3 space-y-0.5 border-l border-neutral-200 pl-3">
                                {EVENTO_TABS.map((tab) => {
                                  const tabHref = `/eventi/${e.id}${tab.segment}`;
                                  const tabActive =
                                    tab.segment === ""
                                      ? pathname === tabHref
                                      : pathname === tabHref ||
                                        pathname.startsWith(tabHref + "/");
                                  return (
                                    <li key={tab.label}>
                                      <Link
                                        href={tabHref}
                                        onClick={() =>
                                          setSidebarOpen(false)
                                        }
                                        className={`block px-3 py-1.5 rounded text-sm ${
                                          tabActive
                                            ? "bg-amber-50 text-amber-800 font-medium"
                                            : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                                        }`}
                                      >
                                        {tab.label}
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-3 border-t border-neutral-200">
          <a
            href="https://matazz.ch"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Vai a matazz.ch"
            className="font-glassure text-5xl leading-none text-neutral-900 hover:text-amber-700 transition-colors px-1 select-none inline-block"
          >
            m
          </a>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex items-center justify-end px-6 py-3 border-b border-neutral-200 bg-white gap-4 text-sm">
          <span className="text-neutral-700">
            Ciao, <strong className="text-neutral-900">{identityName}</strong>
          </span>
          <form action={cambiaIdentita}>
            <button
              type="submit"
              className="text-amber-700 hover:text-amber-800 underline"
            >
              Cambia identità
            </button>
          </form>
        </header>

        <div className="md:hidden flex items-center justify-between px-4 py-2 bg-white border-b border-neutral-200 text-sm">
          <span className="text-neutral-700">
            Ciao, <strong className="text-neutral-900">{identityName}</strong>
          </span>
          <form action={cambiaIdentita}>
            <button
              type="submit"
              className="text-amber-700 hover:text-amber-800 underline"
            >
              Cambia identità
            </button>
          </form>
        </div>

        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
