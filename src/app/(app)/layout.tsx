import { requireCurrentIdentity } from "@/lib/auth/identity";
import { createServerClient } from "@/lib/supabase/server";
import { AppShell, type EventoLink } from "./_components/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await requireCurrentIdentity();
  const sb = createServerClient();
  const { data } = await sb
    .from("eventi")
    .select("id, nome, data_inizio")
    .order("data_inizio", { ascending: false });
  const eventi = (data ?? []) as EventoLink[];
  return (
    <AppShell identityName={me.nome} eventi={eventi}>
      {children}
    </AppShell>
  );
}
