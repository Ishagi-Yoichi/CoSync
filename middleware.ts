
import { getToken } from "next-auth/jwt";
import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req:NextRequest){
  const token = await getToken({req, secret:process.env.NEXTAUTH_SECRET});
  const isAuthPage =
  req.nextUrl.pathname.startsWith("/signin") ||
  req.nextUrl.pathname.startsWith("/signup") 

  if(!token && !isAuthPage){
    const callbackUrl = req.nextUrl.pathname + req.nextUrl.search;
    return NextResponse.redirect(
      new URL(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`,req.url)
    );
  }
  return NextResponse.next();
}


export const config = {
  matcher: [
    "/home/:path*",       
    "/editorPage/:path*", 
    "/pricing/:path*"
  ],
};
