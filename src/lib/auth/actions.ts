"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, IDENTITY_COOKIE } from "@/lib/auth/session";

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
  cookieStore.delete(IDENTITY_COOKIE);
  redirect("/login");
}

export async function cambiaIdentita() {
  const cookieStore = await cookies();
  cookieStore.delete(IDENTITY_COOKIE);
  redirect("/seleziona-identita");
}
