import { Plus, Search, Calendar, Trash2, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";

export default function DesignSystemPage() {
  return (
    <div className="space-y-12 max-w-3xl">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Design system
        </h1>
        <p className="mt-2 text-base text-neutral-600">
          Vetrina dei componenti base. Iteriamo qui prima di toccare il resto
          del sito.
        </p>
      </header>

      <Section title="Tipografia" subtitle="Inter via next/font">
        <div className="space-y-3">
          <p className="text-4xl font-semibold tracking-tight text-neutral-900">
            Display · 36 / 40 semibold
          </p>
          <p className="text-3xl font-semibold tracking-tight text-neutral-900">
            Heading 1 · 30 semibold
          </p>
          <p className="text-2xl font-medium text-neutral-900">
            Heading 2 · 24 medium
          </p>
          <p className="text-lg font-medium text-neutral-900">
            Heading 3 · 18 medium
          </p>
          <p className="text-base text-neutral-900">
            Body · 16 regular — il corpo del testo, leggibile su mobile e
            desktop.
          </p>
          <p className="text-sm text-neutral-600">
            Small · 14 secondary — metadati, didascalie, hint.
          </p>
          <p className="text-xs text-neutral-500">
            Caption · 12 muted — uso parsimonioso.
          </p>
        </div>
      </Section>

      <Section title="Colori" subtitle="Palette neutra + accento amber">
        <div className="grid grid-cols-5 gap-2">
          <Swatch label="white" className="bg-white border border-neutral-200" />
          <Swatch label="100" className="bg-neutral-100" />
          <Swatch label="300" className="bg-neutral-300" />
          <Swatch label="600" className="bg-neutral-600" textOnDark />
          <Swatch label="900" className="bg-neutral-900" textOnDark />
        </div>
        <div className="grid grid-cols-5 gap-2 mt-3">
          <Swatch label="amber 50" className="bg-amber-50" />
          <Swatch label="amber 100" className="bg-amber-100" />
          <Swatch label="amber 400" className="bg-amber-400" />
          <Swatch label="amber 600" className="bg-amber-600" textOnDark />
          <Swatch label="amber 700" className="bg-amber-700" textOnDark />
        </div>
      </Section>

      <Section title="Bottoni" subtitle="Altezza 44px (mobile-friendly), raggio 10px">
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
        <div className="flex flex-wrap gap-3 items-center mt-4">
          <Button size="sm">Small</Button>
          <Button>
            <Plus className="w-4 h-4" />
            Con icona
          </Button>
          <Button variant="secondary">
            <Search className="w-4 h-4" />
            Cerca
          </Button>
          <Button variant="ghost">
            Continua
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-3 items-center mt-4">
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Card" subtitle="Bordo hairline, raggio 14px">
        <div className="grid sm:grid-cols-2 gap-3">
          <Card>
            <h3 className="text-base font-medium text-neutral-900">
              Festival 2026
            </h3>
            <p className="text-sm text-neutral-600 mt-1">
              Una card semplice con titolo e testo.
            </p>
          </Card>
          <Card padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-neutral-900">
                  Card con azioni
                </h3>
                <p className="text-sm text-neutral-600 mt-1">
                  Padding più ampio.
                </p>
              </div>
              <Button size="sm" variant="secondary">
                <Calendar className="w-4 h-4" />
                Apri
              </Button>
            </div>
          </Card>
        </div>
      </Section>

      <Section title="Pill / Stati" subtitle="Sfondi pastello, font 12 medium">
        <div className="flex flex-wrap gap-2">
          <Pill tone="neutral">Bozza</Pill>
          <Pill tone="info">In corso</Pill>
          <Pill tone="success">
            <Check className="w-3 h-3" />
            Confermato
          </Pill>
          <Pill tone="warning">Da rivedere</Pill>
          <Pill tone="danger">
            <Trash2 className="w-3 h-3" />
            Annullato
          </Pill>
          <Pill tone="accent">Featured</Pill>
        </div>
      </Section>

      <Section title="Avatar" subtitle="Colore deterministico dal nome">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex flex-col items-center gap-1">
            <Avatar name="Eduardo" size="sm" />
            <span className="text-xs text-neutral-500">sm</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Avatar name="Marco" />
            <span className="text-xs text-neutral-500">md</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Avatar name="Sara" size="lg" />
            <span className="text-xs text-neutral-500">lg</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Avatar name="Giulia" size="xl" />
            <span className="text-xs text-neutral-500">xl</span>
          </div>
        </div>
        <div className="flex gap-2 mt-5 flex-wrap">
          {[
            "Anna",
            "Bruno",
            "Chiara",
            "Davide",
            "Elena",
            "Federico",
            "Greta",
            "Hugo",
            "Ivan",
            "Jasmine",
          ].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <Avatar name={n} size="sm" />
              <span className="text-sm text-neutral-700">{n}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Input" subtitle="Altezza 44px, raggio 10px">
        <div className="space-y-3 max-w-sm">
          <Input placeholder="Nome evento" />
          <Input placeholder="Email" type="email" />
          <Input placeholder="Disabilitato" disabled />
        </div>
      </Section>

      <Section title="Esempio composito" subtitle="Card lista membri">
        <Card padding="none">
          <ul className="divide-y divide-neutral-100">
            {[
              { nome: "Eduardo", ruolo: "Direttore artistico", tone: "accent" as const },
              { nome: "Marco", ruolo: "Tecnico audio", tone: "info" as const },
              { nome: "Sara", ruolo: "Backstage", tone: "success" as const },
              { nome: "Giulia", ruolo: "In ferie", tone: "neutral" as const },
            ].map((p) => (
              <li
                key={p.nome}
                className="flex items-center gap-3 px-4 py-3"
              >
                <Avatar name={p.nome} />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-neutral-900">
                    {p.nome}
                  </p>
                  <p className="text-sm text-neutral-600">{p.ruolo}</p>
                </div>
                <Pill tone={p.tone}>{p.tone}</Pill>
              </li>
            ))}
          </ul>
        </Card>
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-2xl font-medium text-neutral-900">{title}</h2>
        {subtitle && (
          <p className="text-sm text-neutral-600 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Swatch({
  label,
  className,
  textOnDark,
}: {
  label: string;
  className: string;
  textOnDark?: boolean;
}) {
  return (
    <div
      className={`h-16 rounded-card flex items-end p-2 text-xs font-medium ${
        textOnDark ? "text-white" : "text-neutral-700"
      } ${className}`}
    >
      {label}
    </div>
  );
}
