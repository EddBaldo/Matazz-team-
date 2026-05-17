import Link from "next/link";
import {
  Calendar,
  CalendarDays,
  Mic2,
  MapPin,
  Handshake,
  Users,
  Boxes,
} from "lucide-react";
import { requireCurrentIdentity } from "@/lib/auth/identity";
import { cambiaIdentita, logout } from "@/lib/auth/actions";

type Tile = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const TILES: Tile[] = [
  { href: "/eventi", label: "Eventi", Icon: Calendar },
  { href: "/calendario", label: "Calendario", Icon: CalendarDays },
  { href: "/artisti", label: "Scouting Artisti", Icon: Mic2 },
  { href: "/locations", label: "Scouting Location", Icon: MapPin },
  { href: "/sponsor", label: "Scouting Sponsor", Icon: Handshake },
  { href: "/personale", label: "Scouting Staff", Icon: Users },
  { href: "/inventario", label: "Inventario", Icon: Boxes },
];

export default async function HomePage() {
  const me = await requireCurrentIdentity();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-6 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2 text-xs">
        <form action={cambiaIdentita}>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-full text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          >
            Cambia identità
          </button>
        </form>
        <form action={logout}>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-full text-neutral-600 hover:bg-red-50 hover:text-red-700"
          >
            Esci
          </button>
        </form>
      </div>

      <div className="w-full max-w-5xl">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-wide text-neutral-500 font-medium">
            Team Matazz
          </p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight text-neutral-900 mt-2">
            Ben tornato, {me.nome}.
          </h1>
          <p className="text-base text-neutral-600 mt-3">
            Dove vuoi andare?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TILES.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-3xl bg-white p-6 sm:p-7 flex items-center gap-4 hover:-translate-y-0.5 transition-transform"
            >
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-neutral-100 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                <Icon className="w-5 h-5" />
              </span>
              <span className="text-lg font-medium text-neutral-900">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
