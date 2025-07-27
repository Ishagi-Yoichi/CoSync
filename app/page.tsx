import AppBar from "@/components/AppBar";
import { CodeBlock } from "@/components/code-block";
import { Cover } from "@/components/Cover";
import Hero from "@/components/Hero";
import Image from "next/image";


export default function Home() {
  return (
   <div className="bg-black min-h-screen ">
    
    <AppBar/>
    
    <Hero/>
   
   </div>
  )
}
