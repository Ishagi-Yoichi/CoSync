'use client';
import google_png from "@/assets/google_png.png";
import Image from 'next/image';
import { Suspense } from "react";
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Geist } from 'next/font/google';
import Link from 'next/link';
const geist = Geist({ subsets: ['latin'] });

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const SearchParams = useSearchParams();
  const callbackUrl = SearchParams.get("callbackUrl") || "/home"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const res = await signIn('credentials', {
      redirect: false, // handle redirect manually
      email,
      password,
      callbackUrl,
    });

    if (res?.error) {
      setError(res.error);
    } else {
      router.push(res?.url || callbackUrl || '/'); // redirect to home/dashboard
    }
  }

  return (

    <div className="h-screen flex justify-center items-center bg-black">
      <div className="block max-w-sm p-6 bg-white border border-gray-200 rounded-2xl shadow">
        <div className={`text-3xl font-bold mb-4 text-center ${geist.className}`}>
          Sign In
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <label>
            Email:
            <input
              type="email"
              className="w-full mt-1 p-2 border rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nik22@gmail.com"
              required
            />
          </label>

          <label>
            Password:
            <input
              type="password"
              className="w-full mt-1 p-2 border rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          {error && <p className="text-red-500 text-sm">"Something went wrong, please try again After some time"</p>}

          <button
            type="submit"
            className={`mt-4 w-full text-white bg-gray-900 hover:bg-gray-800 focus:ring-4 focus:ring-gray-600 font-medium rounded-3xl text-sm px-5 py-2.5 ${geist.className}`}
          >
            Sign In
          </button>
          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className={`mt-4 w-full text-gray-900 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 font-medium rounded-3xl text-sm px-5 py-2.5 ${geist.className}`}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <span>Sign In with</span>
              <Image src={google_png} alt="Google" width={28} height={28} />
            </span>
          </button>
          <h1 className="text-center text-sm text-gray-600 mt-4">
            Don't have an account? <Link href="/signup" className="text-blue-600 hover:text-blue-800 underline">SignUp Now</Link>
          </h1>
        </form>
      </div>
    </div>

  );
}
export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}