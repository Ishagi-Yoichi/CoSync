"use client";

import google_png from "../../public/icons8-google-logo-48.png";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import {
  IconArrowRight,
  IconLockPassword,
  IconMail,
} from "@tabler/icons-react";

function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/home";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
    });

    if (res?.error) {
      setError(res.error);
    } else {
      router.push(res?.url || callbackUrl || "/");
    }
  }

  return (
    <main className="premium-shell relative min-h-screen overflow-hidden px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="premium-panel rounded-[34px] p-6 md:p-8"
        >
          <div className="premium-kicker">Welcome Back</div>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
            Return to the workspace with a sharper, calmer sign-in flow.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Access rooms, reconnect with your team, and resume where the session
            left off.
          </p>

          <div className="mt-8 space-y-4">
            {[
              "Room re-entry without friction",
              "Shared editing and voice in one space",
              "Premium collaboration UI across every touchpoint",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-6 text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="premium-panel-strong premium-glow-border rounded-[34px] p-6 md:p-8"
        >
          <div className="text-sm uppercase tracking-[0.24em] text-slate-400">
            Sign In
          </div>
          <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">
            Access your CoSync account
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                <IconMail className="h-4 w-4" />
                Email
              </span>
              <input
                type="email"
                className="premium-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                <IconLockPassword className="h-4 w-4" />
                Password
              </span>
              <input
                type="password"
                className="premium-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </label>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <button
              type="submit"
              className="premium-button premium-button-primary inline-flex w-full items-center justify-center gap-2"
            >
              Sign In
              <IconArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="premium-button premium-button-secondary inline-flex w-full items-center justify-center gap-3"
            >
              <Image src={google_png} alt="Google" width={22} height={22} />
              Continue with Google
            </button>
          </form>

          <p className="mt-8 text-sm text-slate-400">
            No account yet?{" "}
            <Link
              href="/signup"
              className="font-semibold text-[#67e8c8] transition-colors hover:text-white"
            >
              Create one now
            </Link>
          </p>
        </motion.section>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07111c]" />}>
      <SignInForm />
    </Suspense>
  );
}
