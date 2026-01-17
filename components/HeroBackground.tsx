"use client";
import { motion } from "motion/react";
import { SparklesCore } from "./Sparkles";

export default function HeroBackground() {
  return (
    <div className="hidden sm:block absolute inset-0 z-0 overflow-hidden pointer-events-none">

      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 via-transparent to-transparent" />

      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 6, repeat: Infinity }}
      >
        <SparklesCore
          background="transparent"
          minSize={0.4}
          maxSize={1}
          particleDensity={220}
          className="w-full h-full min-h-[60vh]"
          particleColor="#3b82f6"
        />
      </motion.div>
    </div>
  );
}
