import Link from "next/link";
import { Mic2, MapPin, Handshake, Users } from "lucide-react";
import { createServerClient } from "@/lib/supabase/server";

type Tile = {
  href: string;
  label: string;
  descr: string;
  Icon: React.ComponentType<{ className?: string }>;
  count: number;
};

export default async function ScoutingPage() {
  const sb = createServerClient();

  const [artisti, locations, sponsor, personale] = await Promise.all([
    sb.from("artisti").select("id", { count: "exact", head: true }),
    sb.from("locations").select("id", { count: "exact", head: true }),
    sb.from("sponsor").select("id", { count: "exact", head: true }),
    sb.from("personale").select("id", { count: "exact", head: true }),
  ]);

  const tiles: Tile[] = [
    {
      href: "/artisti",
      label: "Artisti",
      descr: "Rubrica di chi suona, performa, espone.",
      Icon: Mic2,
      count: artisti.count ?? 0,
    },
    {
      href: "/locations",
      label: "Location",
      descr: "Posti dove potremmo fare un evento.",
      Icon: MapPin,
      count: locations.count ?? 0,
    },
    {
      href: "/sponsor",
      label: "Sponsor",
      descr: "Aziende e realtà che ci sostengono.",
      Icon: Handshake,
      count: sponsor.count ?? 0,
    },
    {
      href: "/personale",
      label: "Staff",
      descr: "Tecnici, fotografi, bar, supporto.",
      Icon: Users,
      count: personale.count ?? 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Scouting
        </h2>
        <p className="text-sm text-neutral-600 mt-2 max-w-xl">
          La rubrica permanente del collettivo: persone, posti e contatti che
          riusiamo a ogni evento.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tiles.map(({ href, label, descr, Icon, count }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-3xl bg-white p-6 sm:p-7 hover:-translate-y-0.5 transition-transform"
          >
            <div className="flex items-start gap-4">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-neutral-100 group-hover:bg-neutral-900 group-hover:text-white transition-colors shrink-0">
                <Icon className="w-5 h-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {label}
                  </h3>
                  <span className="text-sm tabular-nums text-neutral-500">
                    {count}
                  </span>
                </div>
                <p className="text-sm text-neutral-600 mt-1">{descr}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
