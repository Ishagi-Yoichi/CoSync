
import AppBar from "@/components/AppBar";
import Hero from "@/components/Hero";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import HeroBackground from "@/components/HeroBackground";


export default async function Home() {
  await getServerSession(authOptions);
 
  return (
   <div className="bg-black min-h-screen ">
    <HeroBackground/>
    <AppBar/>
    
    <Hero/>
   
   </div>
  )
}
