"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { IconCheck, IconSparkles, IconStarsFilled } from "@tabler/icons-react";

const plans = [
  {
    name: "Starter",
    price: "$0",
    subtitle: "For solo builders and lightweight shared rooms.",
    cta: "Start Free",
    href: "/signup",
    accent: "from-white to-slate-300",
    features: [
      "Unlimited public rooms",
      "Core real-time editing",
      "Basic room recovery",
    ],
  },
  {
    name: "Studio",
    price: "$14",
    subtitle: "For product teams that want premium multiplayer flow.",
    cta: "Upgrade to Studio",
    href: "/signup",
    accent: "from-[#67e8c8] to-[#8ef2ff]",
    featured: true,
    features: [
      "Private collaboration rooms",
      "Built-in room voice and presence",
      "Priority recovery and support",
      "Brand-grade editor experience",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    subtitle: "For larger organizations with compliance and provisioning needs.",
    cta: "Talk to Sales",
    href: "/home",
    accent: "from-[#f6b365] to-[#ffe2bc]",
    features: [
      "Dedicated deployment planning",
      "Advanced onboarding support",
      "Security review assistance",
      "Custom contractual coverage",
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="premium-shell relative min-h-screen overflow-hidden px-4 py-10 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="premium-panel-strong rounded-[34px] px-6 py-6 md:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="premium-chip">
                <IconSparkles className="h-4 w-4 text-[#67e8c8]" />
                Pricing
              </div>
              <h1 className="mt-5 text-5xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
                Premium collaboration plans for every team stage.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Start free, move into voice-native teamwork, and scale into a dedicated collaboration stack when your team needs it.
              </p>
            </div>

            <Link href="/home" className="premium-button premium-button-primary inline-flex items-center justify-center">
              Open Workspace
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.section
              key={plan.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className={`premium-panel relative rounded-[32px] p-7 ${
                plan.featured ? "premium-glow-border bg-[rgba(12,22,32,0.9)]" : ""
              }`}
            >
              {plan.featured ? (
                <div className="absolute right-6 top-6 inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#67e8c8]">
                  <IconStarsFilled className="h-4 w-4" />
                  Most Popular
                </div>
              ) : null}

              <div className={`inline-flex rounded-full bg-gradient-to-r ${plan.accent} px-4 py-1 text-xs font-bold uppercase tracking-[0.26em] text-slate-950`}>
                {plan.name}
              </div>
              <div className="mt-6 text-5xl font-semibold tracking-[-0.06em] text-white">{plan.price}</div>
              <p className="mt-4 min-h-14 text-sm leading-7 text-slate-300">{plan.subtitle}</p>

              <div className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.035] px-4 py-3">
                    <div className="mt-0.5 rounded-full bg-emerald-400/10 p-1 text-emerald-200">
                      <IconCheck className="h-4 w-4" />
                    </div>
                    <div className="text-sm leading-6 text-slate-200">{feature}</div>
                  </div>
                ))}
              </div>

              <Link
                href={plan.href}
                className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3 font-semibold transition-transform hover:-translate-y-0.5 ${
                  plan.featured
                    ? "bg-[linear-gradient(135deg,#67e8c8,#8ef2ff)] text-slate-950"
                    : "border border-white/10 bg-white/6 text-white"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.section>
          ))}
        </div>
      </div>
    </main>
  );
}
