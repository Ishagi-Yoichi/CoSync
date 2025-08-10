// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const publicPaths = ["/"]; // ✅ Only "/" is public
  const pathname = req.nextUrl.pathname;
  const isPublic = publicPaths.includes(pathname);

  // If it's public, skip auth
  if (isPublic) {
    return NextResponse.next();
  }

  // For all other paths, check token
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api).*)", 
    // api excluded here, handle separately if needed
  ],
};
