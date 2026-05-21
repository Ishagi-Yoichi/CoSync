import AppBar from "@/components/AppBar";
import Hero from "@/components/Hero";
import HeroBackground from "@/components/HeroBackground";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";

export default async function Home() {
  await getServerSession(authOptions);

  return (
    <div className="premium-shell relative min-h-screen overflow-hidden">
      <HeroBackground />
      <AppBar />
      <Hero />
    </div>
  );
}
