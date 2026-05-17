"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSharedPassword } from "@/lib/env";
import {
  AUTH_COOKIE,
  AUTH_MAX_AGE_SECONDS,
  constantTimeEqual,
  expectedAuthToken,
} from "@/lib/auth/session";

export async function login(formData: FormData) {
  const password = formData.get("password");
  if (typeof password !== "string" || !constantTimeEqual(password, getSharedPassword())) {
    redirect("/login?error=1");
  }

  const token = await expectedAuthToken();
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_MAX_AGE_SECONDS,
  });

  redirect("/");
}
