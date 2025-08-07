"use client"
"use client";
import { Cover } from "./Cover";
import { CodeBlock } from "@/components/code-block";
import { useRouter } from "next/navigation";
import { HoverEffect } from "./card-hover-effect";

export const projects = [
    {
        title: "Real Time Collabaration",
        description: "See every keystroke as it happens. Multiple cursors, live editing, and instant synchronization across all participants.",
        link: "https://www.google.com"
    },
    {
        title: "Easy Room Creation",
        description: "Create a room with a unique ID and share it with your team. No need to worry about passwords or logins.",
        link: "https://www.google.com"
    },
    {
        title: "Easy Room Creation",
        description: "Create a room with a unique ID and share it with your team. No need to worry about passwords or logins.",
        link: "https://www.google.com"
    },
    {
        title: "Easy Room Creation",
        description: "Create a room with a unique ID and share it with your team. No need to worry about passwords or logins.",
        link: "https://www.google.com"
    },
    {
        title: "Easy Room Creation",
        description: "Create a room with a unique ID and share it with your team. No need to worry about passwords or logins.",
        link: "https://www.google.com"
    },
    {
        title: "Easy Room Creation",
        description: "Create a room with a unique ID and share it with your team. No need to worry about passwords or logins.",
        link: "https://www.google.com"
    }
]

export default function Hero() {
    const router = useRouter();
    
    const handleCreateRoom = () => {
        router.push('/home');
    };
    
    return (
        <div>
        <section className="flex flex-col items-center justify-center min-h-[60vh] text-white font-bold text-4xl px-4 text-center mt-24">
            <h1 className="py-4 text-5xl">
                <span className="text-blue-400">{'{ '}</span>
                Code
                <span className="text-blue-400">{' }'}</span>
                {' '}Together.<Cover>Build Faster 🚀</Cover> 
            </h1>
                <p className="font-normal text-lg text-gray-300 max-w-xl">
                Collaborate in real-time with your team. Share code, ideas, and more—all in one place.
                </p>
            <div className="flex-row mx-auto space-x-14 mt-10">
                <button className="bg-white text-black cursor-pointer rounded-2xl p-3 font-medium text-xl transition-transform duration-200 ease-in-out hover:scale-105 hover:shadow-amber-500" onClick={handleCreateRoom}>Create Room</button>
                <button className="bg-blue-400 p-2.5 text-black cursor-pointer rounded-2xl font-medium text-xl transition-transform duration-200 ease-in-out hover:scale-105 hover:shadow-lg">Watch Demo</button>
            </div>
            <div className="py-7">
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
             </div>
              <h2 className="text-3xl font-bold text-center text-white relative w-fit mx-auto mt-10">
                  Why CodeSync?
                <span className="absolute left-0 -bottom-1 h-[2.5px] w-full bg-blue-500 rounded-full shadow-[0_0_15px_5px_rgba(59,130,246,0.5)] animate-ping"></span>
               </h2> 


            
            
        </section>
        <div className="mt-4">
            <HoverEffect items={projects}/>
        </div>
        </div>
       

    );
}