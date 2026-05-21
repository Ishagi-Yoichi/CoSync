'use client';
import Link from 'next/link';
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { IconArrowRight, IconAt, IconLockPassword, IconUser } from '@tabler/icons-react';
function SignUpForm() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/home";
    async function handleSubmit() {
        setError('');
        setSuccess('');
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.message || 'Something went wrong');
            return;
        }
        setSuccess('Account created successfully. Redirecting to sign in...');
        router.push(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
    return (<main className="premium-shell relative min-h-screen overflow-hidden px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.98fr_1.02fr]">
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="premium-panel rounded-[34px] p-6 md:p-8">
          <div className="premium-kicker">Create Account</div>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
            Start with a workspace experience that already feels enterprise-grade.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Join CoSync to create rooms, invite collaborators, and work inside a premium multiplayer editor from the first session.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
            'Reusable room identity',
            'Integrated voice collaboration',
            'Resilient reconnect flow',
            'Elegant editor workspace',
        ].map((item) => (<div key={item} className="rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-5 text-sm font-medium text-slate-100">
                {item}
              </div>))}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }} className="premium-panel-strong premium-glow-border rounded-[34px] p-6 md:p-8">
          <div className="text-sm uppercase tracking-[0.24em] text-slate-400">Sign Up</div>
          <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">Create your CoSync identity</div>

          <div className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                <IconUser className="h-4 w-4"/>
                Username
              </span>
              <input className="premium-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your display name"/>
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                <IconAt className="h-4 w-4"/>
                Email
              </span>
              <input className="premium-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" type="email"/>
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                <IconLockPassword className="h-4 w-4"/>
                Password
              </span>
              <input className="premium-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a secure password" type="password"/>
            </label>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

            <button type="button" onClick={handleSubmit} className="premium-button premium-button-primary inline-flex w-full items-center justify-center gap-2">
              Create Account
              <IconArrowRight className="h-4 w-4"/>
            </button>
          </div>

          <p className="mt-8 text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/signin" className="font-semibold text-[#67e8c8] transition-colors hover:text-white">
              Sign in
            </Link>
          </p>
        </motion.section>
      </div>
    </main>);
}
export default function SignUp() {
    return (<Suspense fallback={<div className="min-h-screen bg-[#07111c]"/>}>
      <SignUpForm />
    </Suspense>);
}
