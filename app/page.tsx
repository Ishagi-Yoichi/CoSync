"use client";
import { useEffect } from "react";
import { redirect, useRouter } from "next/navigation";
import { getSession } from "./home/page";
import AppBar from "@/components/AppBar";
import { CodeBlock } from "@/components/code-block";
import { Cover } from "@/components/Cover";
import Hero from "@/components/Hero";
import { getServerSession } from "next-auth";
import Image from "next/image";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import HeroBackground from "@/components/HeroBackground";


export default async function Home() {
  const router = useRouter();
  useEffect(() => {
    const session = getSession();
    if (session) {
      router.replace(`/editorPage?roomId=${session.roomId}&username=${encodeURIComponent(session.username)}`);
    }
  }, []);

  return (
    <div className="bg-black min-h-screen ">
      <HeroBackground />
      <AppBar />
      <Hero />
    </div>
  )
}
