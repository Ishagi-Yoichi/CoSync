"use client";
"use client";
import { Cover } from "./Cover";
import { CodeBlock } from "@/components/code-block";
import { useRouter } from "next/navigation";
import { HoverEffect } from "./card-hover-effect";
import { motion } from "motion/react";
import HeroBackground from "./HeroBackground";

export const projects = [
  {
    title: "Real Time Collabaration",
    description:
      "See every keystroke as it happens. Multiple cursors, live editing, and instant synchronization across all participants.",
    link: "#features",
  },
  {
    title: "Easy Room Creation",
    description:
      "Create a room with a unique ID and share it with your team. No need to worry about passwords or logins.",
    link: "#features",
  },
  {
    title: "Seamless Reconnection",
    description:
      "No worries of losing connection to room, re-connect in seconds with just a click.",
    link: "#features",
  },
  {
    title: "Afordable Pricing",
    description:
      "Grab a pocket friendly deal and enjoy sharing code with ease.",
    link: "/pricing",
  },
];

export default function Hero() {
  const router = useRouter();

  const handleCreateRoom = () => {
    router.push("/home");
  };

  return (
    <div>
      <section className="relative flex flex-col items-center justify-center min-h-[60vh] text-white font-bold text-2xl sm:text-4xl px-4 text-center mt-12 sm:mt-24 overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
            <motion.h1
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="py-4 text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
                >
            <span className="text-blue-400">{"{ "}</span>
            Code
            <span className="text-blue-400">{" }"}</span> Together.
            <Cover>Build Faster 🚀</Cover>
            </motion.h1>
            <motion.p 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="font-normal text-base sm:text-lg text-gray-300 max-w-xl px-4"
            >
            Collaborate in real-time with your team. Share code, ideas, and
            more-all in one place.
            </motion.p>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="flex flex-col sm:flex-row mx-auto gap-4 sm:gap-14 mt-8 sm:mt-10 px-4">
            <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0px 0px 25px rgba(59,130,246,0.6)" }}
                whileTap={{ scale: 0.97 }}
                className="bg-white text-black cursor-pointer rounded-2xl p-3 font-medium text-lg sm:text-xl transition-transform duration-200 ease-in-out hover:scale-105 hover:shadow-amber-500 w-full sm:w-auto"
                onClick={handleCreateRoom}
            >
                Create Room
            </motion.button>
            <motion.button 
                whileHover={{ scale: 1.05, boxShadow: "0px 0px 25px rgba(59,130,246,0.6)" }}
                whileTap={{ scale: 0.97 }}
                className="bg-blue-400 p-2.5 text-black cursor-pointer rounded-2xl font-medium text-lg sm:text-xl transition-transform duration-200 ease-in-out hover:scale-105 hover:shadow-lg w-full sm:w-auto">
                Watch Demo
            </motion.button>
            </motion.div>
            <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="py-7 px-4 w-full max-w-4xl mx-auto">
            <CodeBlock
                language="javascript"
                filename="example.js"
                code={`const DummyComponent = () => {
                        const [count, setCount] = React.useState(0);

                        const handleClick = () => {
                        setCount(prev => prev + 1);
                        };

                            return (
                                <div className="p-4 border rounded-lg">
                                <h2 className="text-xl font-bold mb-4">Fights Counter</h2>
                                <p className="mb-2">Fight Club Fights Count: {count}</p>
                                <button 
                                    onClick={handleClick}
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Increment
                                </button>
                                </div>
                            );
                        };
                    `}
            />
            </motion.div>
        </div>
      </section>
        <HoverEffect items={projects} />
    </div>
  );
}