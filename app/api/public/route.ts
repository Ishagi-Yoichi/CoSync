// app/api/public/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Public route" });
}
