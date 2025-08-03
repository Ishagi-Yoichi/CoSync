import { NextRequest, NextResponse } from 'next/server';
import { signupHandler } from '@/controllers/auth/signup';

export async function POST(req: NextRequest) {
  const body = await req.json();
  return signupHandler(body);
}
