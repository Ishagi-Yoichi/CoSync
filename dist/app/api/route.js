// app/api/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth/[...nextauth]/route";
export async function GET(request) {
    const session = await getServerSession(authOptions);
    // If not authenticated, return 401
    if (!session) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    // If authenticated, return user info
    return NextResponse.json({ authenticated: true, user: session.user });
}
