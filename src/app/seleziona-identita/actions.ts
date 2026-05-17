"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  IDENTITY_COOKIE,
  IDENTITY_MAX_AGE_SECONDS,
} from "@/lib/auth/session";
import { createServerClient } from "@/lib/supabase/server";

export async function selezionaIdentita(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) {
    redirect("/seleziona-identita");
  }

  const sb = createServerClient();
  const { data } = await sb
    .from("team_matazz")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    redirect("/seleziona-identita");
  }

  const cookieStore = await cookies();
  cookieStore.set(IDENTITY_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: IDENTITY_MAX_AGE_SECONDS,
  });

  redirect("/");
}
