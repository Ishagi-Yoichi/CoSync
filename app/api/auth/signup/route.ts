import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client'; // adjust path if needed
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from "@/lib/prisma";

// Zod schema for validation
const SignupSchema = z.object({
  name: z.string().min(2, 'Name too short'),
  email: z.string().email(),
  password: z.string().min(6, 'Password too short'),
});

//post handler
export async function POST(req: Request) {
  try {
    const body = await req.json();

    //validate input
    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((e:any) => e.message).join(', ');
      return NextResponse.json({ message: errorMsg }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

  
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user to DB
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ message: 'User created', user: { id: user.id, email: user.email } }, { status: 201 });

  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
