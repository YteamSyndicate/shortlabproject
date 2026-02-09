"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import type { DramaDetail } from "@/lib/types";
import { getVideoStream } from "@/lib/api";
import { resolveStream, type StreamPayload } from "@/utils/streamResolver";
import { Play } from "lucide-react";

// --- ANIMATIONS ---
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" } as Transition
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1 }
};

// --- MAIN COMPONENT ---
export default function WatchClient({ drama }: { drama: DramaDetail }) {
  const [activeEpisode, setActiveEpisode] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const episodes = drama.chapters || [];
  const currentEpisode = episodes[activeEpisode];

  useEffect(() => { 
    setIsMounted(true); 
  }, []);

  const fetchUrl = useCallback(async () => {
    if (!currentEpisode) return;

    setVideoUrl(""); 
    setIsLoading(true);

    try {
      if (currentEpisode.url && currentEpisode.url.startsWith('http')) {
        setVideoUrl(currentEpisode.url);
        setIsLoading(false);
        return;
      }

      if (currentEpisode.vid) {
        const streamData = await getVideoStream(String(currentEpisode.vid), drama.platform);
        
        if (!streamData) {
          setVideoUrl("");
        } else {
          const resolved = resolveStream(streamData as StreamPayload, currentEpisode.vid);
          if (resolved && resolved.url) {
            setVideoUrl(resolved.url);
          } else {
            const fallback = resolveStream(streamData as unknown as StreamPayload);
            setVideoUrl(fallback?.url || "");
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch video URL:", error);
      setVideoUrl("");
    } finally {
      setIsLoading(false);
    }
  }, [currentEpisode, drama.platform]);

  useEffect(() => {
    if (isMounted) {
      fetchUrl();
      setHasStarted(false); 
    }
  }, [activeEpisode, isMounted, fetchUrl]);

  const handleEpisodeChange = (idx: number) => {
    if (idx === activeEpisode || isLoading) return;
    setActiveEpisode(idx);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleStartVideo = () => {
    setHasStarted(true);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(err => console.log("Autoplay blocked:", err));
      }
    }, 100);
  };

  if (!isMounted) return null;

  return (
    <div className="pt-32 md:pt-44 px-6 md:px-12 lg:px-20 max-w-400 mx-auto pb-32">
      
      {/* BREADCRUMBS */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-12 overflow-x-auto whitespace-nowrap no-scrollbar"
      >
        <Link href="/" className="hover:text-red-600 transition-colors">Beranda</Link>
        <span className="text-zinc-800 text-xs">/</span>
        <span className="text-zinc-400 truncate max-w-37.5">{drama.title}</span>
        <span className="text-zinc-800 text-xs">/</span>
        <span className="text-red-600">Eps {activeEpisode + 1}</span>
      </motion.div>

      <div className="flex flex-col xl:flex-row gap-12 xl:gap-16">
        
        {/* PLAYER SECTION */}
        <div className="flex-1 min-w-0"> 
          <motion.div 
             {...fadeIn}
             className="relative aspect-video bg-zinc-950 rounded-2xl overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.9)] border border-white/5"
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center bg-black z-30">
                   <div className="w-12 h-12 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin mb-4" />
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Menyambungkan Server...</span>
                </motion.div>
              ) : videoUrl ? (
                <motion.div 
                  key={videoUrl}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full h-full relative"
                >
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls={hasStarted}
                    playsInline
                    controlsList="nodownload"
                    className="w-full h-full object-contain bg-black"
                    {...({ referrerPolicy: "no-referrer" } as React.VideoHTMLAttributes<HTMLVideoElement>)}
                  />

                  {!hasStarted && (
                    <div 
                      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer group"
                      onClick={handleStartVideo}
                    >
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-transform"
                      >
                        <Play className="text-white fill-white ml-1" size={32} />
                      </motion.div>
                      <span className="mt-4 text-white text-[10px] font-black uppercase tracking-[0.4em] opacity-60 group-hover:opacity-100 transition-opacity">
                        Klik Untuk Menonton
                      </span>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-700 bg-zinc-900/20">
                  <div className="w-12 h-0.5 bg-red-600 mb-4 opacity-50" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">Video Belum Tersedia</span>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
          
          {/* INFO SECTION */}
          <div className="mt-12 flex items-start gap-6">
            <motion.div 
              animate={{ height: [40, 64, 40] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="w-2 bg-red-600 rounded-full shadow-[0_0_25px_rgba(220,38,38,0.5)] shrink-0" 
            />
            <div className="min-w-0">
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.85] wrap-break-word">
                {drama.title}
              </h1>
              <div className="flex flex-wrap items-center gap-5 mt-8">
                <span className="relative flex h-3 w-3 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </span>
                <span className="text-white text-[10px] font-black uppercase tracking-widest">Sinopsis</span>
                <p className="text-zinc-400 text-base md:text-lg leading-relaxed text-justify opacity-90 whitespace-pre-line font-medium md:pl-8">
                  {drama.intro || `Sekarang menonton episode ${activeEpisode + 1} dari ${drama.title}. Nikmati kualitas streaming terbaik tanpa gangguan.`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR EPISODE LIST */}
        <div className="w-full xl:w-96 shrink-0">
          <div className="sticky top-32">
            <div className="flex items-center justify-between mb-8 px-2 border-b border-white/5 pb-6">
              <h3 className="text-sm font-black uppercase tracking-[0.4em] text-white">List Episode</h3>
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded-full border border-white/5">
                {episodes.length} Total
              </span>
            </div>
            
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-5 sm:grid-cols-8 xl:grid-cols-4 gap-2.5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar"
            >
              {episodes.map((_, idx) => (
                <motion.button 
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleEpisodeChange(idx)}
                  className={`relative aspect-square flex items-center justify-center text-[11px] font-black transition-all rounded-lg border-2 ${
                    activeEpisode === idx 
                      ? 'bg-red-600 border-red-600 text-white shadow-[0_10px_25px_rgba(220,38,38,0.4)] z-10' 
                      : 'border-white/5 text-zinc-600 hover:border-red-600/50 hover:text-white bg-zinc-950/50'
                  }`}
                >
                  {idx + 1}
                </motion.button>
              ))}
            </motion.div>

            {/* STATUS BOX */}
            <div className="mt-10 p-6 bg-zinc-950/80 border border-white/5 rounded-2xl shadow-inner">
               <div className="flex items-center gap-3 mb-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                  <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">SHORTLAB Engine</span>
               </div>
               <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Server: {drama.platform || 'Global'}</p>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}