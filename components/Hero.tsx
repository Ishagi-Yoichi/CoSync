import { Cover } from "./Cover";

import { CodeBlock } from "@/components/code-block";

export default function Hero() {
    return (
        <section className="flex flex-col items-center justify-center min-h-[60vh] text-white font-bold text-4xl px-4 text-center mt-24">
            <h1 className="py-4">
                <span className="text-blue-400">{'{ '}</span>
                Code
                <span className="text-blue-400">{' }'}</span>
                {' '}Together.<Cover>Build Faster 🚀</Cover> 
            </h1>
                <p className="font-normal text-lg text-gray-300 max-w-xl">
                Collaborate in real-time with your team. Share code, ideas, and more—all in one place.
                </p>
            <div className="flex-row mx-auto space-x-14 mt-10">
                <button className="bg-white text-black cursor-pointer rounded-2xl p-3 font-medium text-xl">Create Room</button>
                <button className="bg-blue-400 p-2.5 text-black cursor-pointer rounded-2xl font-medium text-xl">Watch Demo</button>
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
            <div className="text-4xl text-white font-bold">
                        Why CodeSync?
            </div>
            <section className="flex justify-around mx-4 ">
             <div className="bg-white border border-gray-300 rounded-lg shadow-md p-4 justify-around w-auto">
                <h2 className="text-xl font-bold mb-2">Real Time Collabaration</h2>
                <p className="text-gray-700">See every keystroke as it happens. Multiple cursors, live editing, and instant synchronization across all participants.</p>
             </div>

             <div className="bg-white border border-gray-300 rounded-lg shadow-md p-4 justify-around w-auto">
                <h2 className="text-xl font-bold mb-2">Easy Room Creation</h2>
                <p className="text-gray-700">See every keystroke as it happens. Multiple cursors, live editing, and instant synchronization across all participants.</p>
             </div>

            </section>
        </section>

    );
}