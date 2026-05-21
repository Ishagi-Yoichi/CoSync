"use client";
import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { IconArrowUpRight, IconMenu2, IconX } from "@tabler/icons-react";
const navigation = [
    { label: "Platform", href: "#platform" },
    { label: "Use Cases", href: "#use-cases" },
    { label: "Pricing", href: "/pricing" },
];
export default function AppBar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    return (<div className="sticky top-0 z-40 px-4 pt-5 md:px-8">
            <motion.header initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }} className="premium-panel-strong premium-glow-border mx-auto max-w-7xl rounded-[30px] px-5 py-3.5 md:px-7">
                <div className="flex items-center justify-between gap-4">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#67e8c8,#f6b365)] text-sm font-extrabold text-slate-950 shadow-[0_18px_45px_rgba(103,232,200,0.2)]">
                            Co
                        </div>
                        <div>
                            <div className="text-[1.05rem] font-semibold tracking-[-0.045em] text-white">CoSync</div>
                            <div className="text-[10px] uppercase tracking-[0.26em] text-slate-400">Realtime Collaboration</div>
                        </div>
                    </Link>

                    <nav className="hidden items-center gap-7 md:flex">
                        {navigation.map((item) => (<Link key={item.label} href={item.href} className="text-[0.95rem] font-medium tracking-[-0.02em] text-slate-300 transition-colors hover:text-white">
                                {item.label}
                            </Link>))}
                    </nav>

                    <div className="hidden items-center gap-3 md:flex">
                        <Link href="/signin" className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-[0.95rem] font-semibold tracking-[-0.02em] text-slate-100 transition-colors hover:bg-white/10">
                            Sign In
                        </Link>
                        <Link href="/home" className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#67e8c8,#8ef2ff)] px-5 py-2.5 text-[0.95rem] font-semibold tracking-[-0.025em] text-slate-950 transition-transform hover:-translate-y-0.5">
                            Open Workspace
                            <IconArrowUpRight className="h-4 w-4"/>
                        </Link>
                    </div>

                    <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white md:hidden" onClick={() => setIsMenuOpen((open) => !open)} aria-label="Toggle menu">
                        {isMenuOpen ? <IconX className="h-5 w-5"/> : <IconMenu2 className="h-5 w-5"/>}
                    </button>
                </div>

                {isMenuOpen ? (<div className="mt-4 rounded-[26px] border border-white/10 bg-black/20 p-4 md:hidden">
                        <div className="flex flex-col gap-3">
                            {navigation.map((item) => (<Link key={item.label} href={item.href} className="rounded-2xl bg-white/5 px-4 py-3 text-sm font-medium text-slate-200" onClick={() => setIsMenuOpen(false)}>
                                    {item.label}
                                </Link>))}
                            <Link href="/signin" className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-100" onClick={() => setIsMenuOpen(false)}>
                                Sign In
                            </Link>
                            <Link href="/home" className="rounded-2xl bg-[linear-gradient(135deg,#67e8c8,#8ef2ff)] px-4 py-3 text-sm font-semibold text-slate-950" onClick={() => setIsMenuOpen(false)}>
                                Open Workspace
                            </Link>
                        </div>
                    </div>) : null}
            </motion.header>
        </div>);
}
