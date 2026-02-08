"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import SearchBar from "./SearchBar";
import ExpandableText from "./ExpandableText";
import { type DramaItem } from "@/lib/types";

interface HeroUIProps {
  highlight: DramaItem;
  randomPick: DramaItem | null;
  popularKeywords: DramaItem[];
}

export default function HeroUI({ highlight, popularKeywords }: HeroUIProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={highlight.bookId}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative min-h-[90vh] md:h-[85vh] lg:h-screen w-full bg-black overflow-hidden flex items-end font-sans"
      >
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.4 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          <Image 
            src={highlight.horizontalCover || highlight.cover || "https://images.unsplash.com/photo-1598897349489-bc4746421e5a?q=80&w=1000&auto=format&fit=crop"} 
            alt={highlight.title} 
            fill 
            className="object-cover object-top md:object-[center_15%]" 
            priority
            unoptimized 
          />
          <div className="absolute inset-0 bg-linear-to-r from-black via-black/70 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent" />
        </motion.div>

        <div className="relative z-20 w-full pb-20 md:pb-20 lg:pb-15 px-6 md:px-12 lg:px-20 pt-35">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3, duration: 0.8 }}
            className="max-w-4xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-red-600 text-[9px] md:text-[10px] font-black px-2 py-1 md:px-2.5 md:py-1 uppercase tracking-widest shadow-lg">
                TRENDING
              </span>
              <span className="text-yellow-500 text-[10px] md:text-[12px] font-black">★ {highlight.score || '9.8'}</span>
            </div>

            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-4 md:mb-6 leading-[0.9] tracking-tighter uppercase drop-shadow-2xl max-w-2xl lg:max-w-3xl">
              {highlight.title}
            </h2>

            <div className="max-w-xl md:max-w-lg lg:max-w-xl mb-8 md:mb-8">
              <ExpandableText 
                text={highlight.intro || "Nonton drama pendek pilihan terbaik."} 
                title={highlight.title} 
                cover={highlight.cover} 
                bookId={highlight.bookId}
                score={highlight.score || "9.8"} 
                chapterCount={highlight.chapterCount}
                tag={highlight.tag}
                variant="hero"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-8 md:mb-10 font-sans">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Link 
                  href={`/watch/dramabox/${highlight.bookId}`} 
                  className="bg-red-600 text-white px-8 md:px-10 py-3 md:py-4 rounded-sm font-black text-[10px] md:text-[12px] tracking-widest hover:bg-white hover:text-black transition-all inline-block shadow-2xl"
                >
                  TONTON SEKARANG
                </Link>
              </motion.div>
            </div>

            <div className="w-full max-w-md md:max-w-sm lg:max-w-md">
              <SearchBar />
              <div className="mt-4 flex flex-wrap gap-3 md:gap-4">
                <span className="text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-widest">PENCARIAN POPULER:</span>
                {popularKeywords.slice(0, 3).map((kw, idx) => (
                  <Link 
                    key={idx} 
                    href={`/search?query=${encodeURIComponent(kw.title)}`} 
                    className="text-[9px] md:text-[10px] text-zinc-400 hover:text-red-600 uppercase font-bold transition-colors"
                  >
                    #{kw.title}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}