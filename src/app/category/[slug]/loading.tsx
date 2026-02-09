"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center font-sans">
      <div className="relative text-center">
        <div className="text-2xl md:text-3xl font-black text-red-600 animate-pulse tracking-tighter uppercase">
          Shortlab Loading
        </div>

        <div className="mt-6 h-0.5 bg-zinc-900 w-48 md:w-64 mx-auto overflow-hidden rounded-full">
          <motion.div 
            initial={{ x: "-100%" }} 
            animate={{ x: "100%" }} 
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "linear" 
            }} 
            className="h-full bg-red-600 shadow-[0_0_20px_#dc2626,0_0_10px_#dc2626]" 
          />
        </div>

        <div className="mt-4 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.4em]">
          Preparing Content
        </div>
      </div>
    </div>
  );
}