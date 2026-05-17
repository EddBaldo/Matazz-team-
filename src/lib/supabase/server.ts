// Usa la service_role key: bypassa RLS, deve restare lato server.
// L'import "server-only" fa fallire la build se qualcuno importa questo file da un Client Component.
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseServiceRoleKey } from "@/lib/env";

export function createServerClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false },
  });
}
