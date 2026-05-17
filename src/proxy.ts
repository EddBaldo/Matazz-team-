import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_COOKIE,
  IDENTITY_COOKIE,
  isValidAuthToken,
} from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const hasValidToken = await isValidAuthToken(token);
  const hasIdentity = !!request.cookies.get(IDENTITY_COOKIE)?.value;

  if (pathname === "/login") {
    if (hasValidToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!hasValidToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/seleziona-identita") {
    return NextResponse.next();
  }

  if (!hasIdentity) {
    return NextResponse.redirect(new URL("/seleziona-identita", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
