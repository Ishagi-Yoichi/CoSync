"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  IconArrowRight,
  IconBroadcast,
  IconDeviceLaptop,
  IconMicrophone2,
  IconRefresh,
  IconUsersGroup,
  IconWaveSine,
} from "@tabler/icons-react";

const productMetrics = [
  { value: "30ms", label: "typing presence feedback" },
  { value: "24/7", label: "session recovery pipeline" },
  { value: "∞", label: "momentum across the room" },
];

const valueCards = [
  {
    icon: IconUsersGroup,
    title: "Shared editing that feels local",
    body: "Cursor movement, room presence, and synchronized code flow through one refined collaboration surface.",
  },
  {
    icon: IconMicrophone2,
    title: "Voice native sessions",
    body: "Bring discussion into the room with built-in audio, speaker indicators, and muted-state clarity for every collaborator.",
  },
  {
    icon: IconRefresh,
    title: "Recovery first architecture",
    body: "New participants, reconnects, and room state restoration are treated as product experiences, not edge cases.",
  },
];

const workspaceSignals = [
  "Persistent room sessions",
  "Voice presence with mute states",
  "Premium editor workspace",
  "Language and zoom controls",
];

export default function Hero() {
  const router = useRouter();

  return (
    <main className="relative mx-auto flex max-w-7xl flex-col gap-14 px-4 pb-20 pt-10 md:px-8 md:pb-28 md:pt-14">
      <section className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative z-10"
        >
          <div className="premium-chip mb-6">
            <IconBroadcast className="h-4 w-4 text-[#67e8c8]" />
            Multiplayer coding for serious teams
          </div>

          <h1 className="premium-title max-w-4xl text-[3.45rem] font-semibold text-white md:text-[5rem] lg:text-[5.35rem]">
            The collaboration workspace for teams that want code, context, and conversation in one premium surface.
          </h1>

          <p className="mt-6 max-w-[46rem] text-[1.02rem] leading-8 text-slate-300 md:text-[1.18rem]">
            CoSync turns real-time editing into a product-grade room experience with resilient sessions, built-in voice, and a workspace that feels closer to a modern design tool than a generic code pad.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <button
              className="premium-button premium-button-primary inline-flex items-center justify-center gap-2"
              onClick={() => router.push("/home")}
            >
              Launch Workspace
              <IconArrowRight className="h-4 w-4" />
            </button>
            <Link
              href="/pricing"
              className="premium-button premium-button-secondary inline-flex items-center justify-center gap-2"
            >
              Explore Plans
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {productMetrics.map((metric) => (
              <div key={metric.label} className="premium-stat">
                <div className="text-[1.75rem] font-semibold tracking-[-0.05em] text-white">{metric.value}</div>
                <div className="mt-2 text-[0.9rem] leading-6 text-slate-400">{metric.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.12, ease: "easeOut" }}
          className="floating-card premium-panel-strong premium-glow-border relative overflow-hidden rounded-[34px] p-5 md:p-6"
        >
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

          <div className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/5 px-4 py-3">
            <div>
              <div className="text-[0.72rem] uppercase tracking-[0.18em] text-slate-400">Live Room</div>
              <div className="mt-1 text-[1.55rem] font-semibold tracking-[-0.045em] text-white">Founders / Sprint Review</div>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-[0.78rem] font-semibold tracking-[-0.01em] text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Stable Connection
            </div>
          </div>

          <div className="mt-5 rounded-[28px] border border-white/10 bg-[#09131f]/95 p-5">
            <div className="flex items-center justify-between text-[0.68rem] uppercase tracking-[0.18em] text-slate-500">
              <span>Session signals</span>
              <span>Voice enabled</span>
            </div>

            <div className="mt-5 grid gap-3">
              {workspaceSignals.map((signal, index) => (
                <div
                  key={signal}
                  className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/6 text-[#67e8c8]">
                      {index === 0 ? <IconDeviceLaptop className="h-5 w-5" /> : null}
                      {index === 1 ? <IconMicrophone2 className="h-5 w-5" /> : null}
                      {index === 2 ? <IconWaveSine className="h-5 w-5" /> : null}
                      {index === 3 ? <IconUsersGroup className="h-5 w-5" /> : null}
                    </div>
                    <div className="text-[0.95rem] font-medium tracking-[-0.02em] text-slate-100">{signal}</div>
                  </div>
                  <div className="rounded-full bg-white/5 px-3 py-1 text-[0.76rem] tracking-[-0.01em] text-slate-300">
                    Ready
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(103,232,200,0.12),rgba(246,179,101,0.06))] p-4">
              <div className="text-[0.95rem] font-semibold tracking-[-0.02em] text-white">Premium workspace preview</div>
              <div className="mt-2 text-[0.92rem] leading-6 text-slate-300">
                Polished navigation, editor controls, audio transmission, and recovery-aware collaboration flows across every room.
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="platform" className="grid gap-5 md:grid-cols-3">
        {valueCards.map(({ icon: Icon, title, body }, index) => (
          <motion.article
            key={title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, delay: index * 0.08 }}
            className="premium-panel rounded-[30px] p-6"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/6 text-[#67e8c8]">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-[1.45rem] font-semibold tracking-[-0.045em] text-white">{title}</h3>
            <p className="mt-3 text-[0.95rem] leading-7 text-slate-300">{body}</p>
          </motion.article>
        ))}
      </section>

      <section id="use-cases" className="premium-panel rounded-[34px] p-6 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="premium-kicker">Use Cases</div>
            <h2 className="mt-4 text-[2.5rem] font-semibold tracking-[-0.055em] text-white md:text-[3rem]">
              Designed for teams that collaborate in the room instead of around it.
            </h2>
            <p className="mt-4 max-w-xl text-[0.98rem] leading-7 text-slate-300">
              Product squads, mentor sessions, technical interviews, and distributed engineering teams all need the same thing: a room that feels immediate, dependable, and elevated.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "Pair programming with voice-native sessions",
              "Architecture reviews with live code walkthroughs",
              "Interview rooms with zero setup friction",
              "Classrooms and cohort-based workshops",
            ].map((item) => (
              <div key={item} className="rounded-[26px] border border-white/10 bg-white/[0.035] p-5">
                <div className="text-[0.7rem] uppercase tracking-[0.18em] text-slate-500">Scenario</div>
                <div className="mt-3 text-[1rem] font-medium leading-7 tracking-[-0.02em] text-white">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
