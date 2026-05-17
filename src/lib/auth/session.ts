import { getSharedPassword } from "@/lib/env";

export const AUTH_COOKIE = "auth_token";
export const AUTH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export const IDENTITY_COOKIE = "user_identity_id";
export const IDENTITY_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function expectedAuthToken(): Promise<string> {
  const data = new TextEncoder().encode("matazz-auth-v1:" + getSharedPassword());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return bytesToBase64Url(new Uint8Array(hash));
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function isValidAuthToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const expected = await expectedAuthToken();
  return constantTimeEqual(token, expected);
}
