import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export default async function EventoLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = await params;
  const sb = createServerClient();
  const { data } = await sb
    .from("eventi")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return <>{children}</>;
}
