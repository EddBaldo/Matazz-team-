import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { IDENTITY_COOKIE } from "@/lib/auth/session";
import { createServerClient } from "@/lib/supabase/server";

export type TeamMember = {
  id: string;
  nome: string;
};

export const getCurrentIdentity = cache(async (): Promise<TeamMember | null> => {
  const cookieStore = await cookies();
  const id = cookieStore.get(IDENTITY_COOKIE)?.value;
  if (!id) return null;

  const sb = createServerClient();
  const { data, error } = await sb
    .from("team_matazz")
    .select("id, nome")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data;
});

export async function requireCurrentIdentity(): Promise<TeamMember> {
  const me = await getCurrentIdentity();
  if (!me) redirect("/seleziona-identita");
  return me;
}
