"use client"
import AppBar from "@/components/AppBar";
import { CodeBlock } from "@/components/code-block";
import { Cover } from "@/components/Cover";
import Hero from "@/components/Hero";
import { getServerSession } from "next-auth";
import Image from "next/image";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";


export default async function Home() {
  const { data:session , status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if(status ==="unauthenticated"){
      router.push("/signin");
    }
  },[status,router]);
  if(status ==="loading") return <div>Loading.....</div>;
  toast.success("Signed Up Successfully");
  return (
   <div className="bg-black min-h-screen ">
    
    <AppBar/>
    
    <Hero/>
   
   </div>
  )
}
