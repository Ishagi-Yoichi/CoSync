import { NextRequest, NextResponse } from 'next/server';
import { signinHandler } from '@/controllers/auth/signin';

export async function POST(req: NextRequest) {
  const body = await req.json();
  return signinHandler(body);
}
