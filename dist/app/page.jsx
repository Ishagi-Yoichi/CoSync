import AppBar from "@/components/AppBar";
import Hero from "@/components/Hero";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
export default async function Home() {
    const session = await getServerSession(authOptions);
    return (<div className="bg-black min-h-screen ">
    
    <AppBar />
    
    <Hero />
   
   </div>);
}
