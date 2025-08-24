'use client';
import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import { Geist } from 'next/font/google';
import { useRouter,useSearchParams } from 'next/navigation';
import { useState } from 'react';

const geist = Geist({ subsets: ['latin'] });

export  function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/home";

  async function handleSubmit() {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || 'Something went wrong');
    } else {
      router.push(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }

  return (
    <div className="h-screen flex justify-center items-center bg-pink-50">
      <div className="block max-w-sm p-6 bg-white border border-pink-200 rounded-2xl shadow">
        <div className={`text-3xl font-bold mb-4 text-center ${geist.className}`}>
          Sign Up
        </div>
        <div className="flex flex-col space-y-4">
          <label>
            Username:
            <input
              className="w-full mt-1 p-2 border rounded"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nikunj Tiwari"
            />
          </label>

          <label>
            Email:
            <input
              className="w-full mt-1 p-2 border rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nik22@yahoo.com"
              type="email"
            />
          </label>

          <label>
            Password:
            <input
              className="w-full mt-1 p-2 border rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nik22@"
              type="password"
            />
          </label>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            className={`mt-4 w-full text-white bg-pink-500 hover:bg-pink-600 focus:ring-4 focus:ring-gray-300 font-medium rounded-3xl text-sm px-5 py-2.5 ${geist.className}`}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SignUp() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpForm />
    </Suspense>
  );
}