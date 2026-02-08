"use client";

import { useState, useEffect, ReactNode, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ExpandableTextProps {
  text: string;
  title: string;
  bookId?: string | number;
  cover?: string;
  score?: string;
  viewers?: string;
  tag?: string; 
  chapterCount?: number;
  variant?: "hero" | "card";
  children?: ReactNode;
  platform?: string; 
}

interface ApiResponse {
  drama?: {
    description?: string;
    labels?: string[];
    chapterCount?: number;
  };
  shotIntroduce?: string;
  shortPlayLabels?: string[];
  totalEpisode?: number;
}

export default function ExpandableText({ 
  text: initialText, 
  title, 
  bookId, 
  cover, 
  score, 
  viewers = "1.2M", 
  tag: initialTag, 
  chapterCount: initialChapterCount, 
  variant = "hero", 
  children,
  platform = "dramabox"
}: ExpandableTextProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sanitize = (val: string | number | null | undefined, fallback: string | number = ""): string | number => {
    if (val === null || val === undefined || val === "undefined" || val === "null" || val === "") {
      return fallback;
    }
    return val;
  };

  const [detailData, setDetailData] = useState({
    synopsis: String(sanitize(initialText, "Tonton keseruan ceritanya sekarang.")),
    tag: String(sanitize(initialTag, "Drama")),
    episodes: Number(sanitize(initialChapterCount, 0))
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  
  const router = useRouter();
  const modalImageUrl = cover || "https://images.unsplash.com/photo-1598897349489-bc4746421e5a?q=80&w=1000&auto=format&fit=crop";

  const fetchDetail = useCallback(async () => {
    if (!bookId || hasFetched) return;

    const isTargetPlatform = platform === 'netshort' || platform === 'flickreels';
    if (!isTargetPlatform) return;

    try {
      setIsLoading(true);
      const url = platform === 'flickreels' 
        ? `https://api.sansekai.my.id/api/flickreels/detailAndAllEpisode?id=${bookId}`
        : `https://api.sansekai.my.id/api/netshort/allepisode?shortPlayId=${bookId}`;

      const res = await fetch(url);
      
      if (res.status === 429) {
        console.warn("Rate limit hit, using fallback data");
        return;
      }

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data: ApiResponse = await res.json();
      
      if (data) {
        if (platform === 'flickreels' && data.drama) {
          setDetailData({
            synopsis: String(sanitize(data.drama.description, initialText)),
            tag: String(sanitize(data.drama.labels?.[0], initialTag)),
            episodes: Number(sanitize(data.drama.chapterCount, initialChapterCount || 0))
          });
        } else if (platform === 'netshort') {
          setDetailData({
            synopsis: String(sanitize(data.shotIntroduce, initialText)),
            tag: String(sanitize(data.shortPlayLabels?.[0], initialTag)),
            episodes: Number(sanitize(data.totalEpisode, initialChapterCount || 0))
          });
        }
        setHasFetched(true);
      }
    } catch (error) {
      console.error(`Gagal ambil detail ${platform}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [bookId, platform, hasFetched, initialText, initialTag, initialChapterCount]);

  useEffect(() => {
    if (isOpen && !hasFetched) {
      const timeoutId = setTimeout(() => {
        fetchDetail();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, fetchDetail, hasFetched]);

  useEffect(() => {
    if (isOpen) {
      const preventScroll = (e: WheelEvent | TouchEvent) => {
        if (!(e.target as HTMLElement).closest(".custom-scrollbar")) {
          if (e.cancelable) e.preventDefault();
        }
      };
      window.addEventListener("wheel", preventScroll, { passive: false });
      window.addEventListener("touchmove", preventScroll, { passive: false });
      return () => {
        window.removeEventListener("wheel", preventScroll);
        window.removeEventListener("touchmove", preventScroll);
      };
    }
  }, [isOpen]);

  const modalLayout = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/95 backdrop-blur-xl pointer-events-auto"
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative bg-zinc-900 border border-white/10 w-full max-w-5xl h-[85vh] md:h-[70vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col pointer-events-auto font-sans"
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 z-50 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-red-600 transition-all shadow-lg"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-[42%_1fr] min-h-0 overflow-y-auto md:overflow-hidden custom-scrollbar">
              <div className="relative h-80 md:h-full bg-zinc-800 overflow-hidden shrink-0 ">
                <Image 
                  src={modalImageUrl} 
                  alt={title || "Cover Image"} 
                  fill 
                  className="object-cover" 
                  priority 
                  unoptimized 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-linear-to-t from-zinc-900 via-transparent to-transparent md:hidden" />
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-transparent to-zinc-900 hidden md:block" />
              </div>

              <div className="flex flex-col min-h-0 bg-zinc-900 md:overflow-hidden">
                <div className="flex-1 md:overflow-y-auto custom-scrollbar p-8 md:p-12 lg:p-14">
                  <div className="flex items-start gap-4 mb-8">
                    <div className="w-1.5 h-10 bg-red-600 rounded-full shrink-0 shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase text-white leading-[1.1] tracking-tighter">
                      {title}
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-3 mb-10">
                    {detailData.tag && (
                      <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[10px] font-black text-red-500 flex items-center shadow-inner tracking-widest uppercase">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full mr-2 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
                        {detailData.tag} <span className="ml-2 opacity-40 text-white font-medium">TAG</span>
                      </div>
                    )}

                    {score && (
                      <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[10px] font-black text-orange-400 flex items-center shadow-inner tracking-widest uppercase">
                        <span className="text-orange-500 mr-2 text-sm">★</span>
                        {score} <span className="ml-2 opacity-40 text-white">RATING</span>
                      </div>
                    )}
                    
                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[10px] font-black text-cyan-400 flex items-center shadow-inner tracking-widest uppercase">
                      <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {viewers} <span className="ml-2 opacity-40 text-white">VIEWS</span>
                    </div>

                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[10px] font-black text-emerald-400 flex items-center shadow-inner tracking-widest uppercase">
                      <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      {detailData.episodes > 0 ? (
                        <>
                          {detailData.episodes} <span className="ml-2 opacity-40 text-white">EPS</span>
                        </>
                      ) : (
                        <span className="text-emerald-400">FULL EPISODE</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Sinopsis</h3>
                      {isLoading && <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />}
                    </div>
                    <p className="text-zinc-400 text-sm md:text-base leading-relaxed text-justify opacity-90 whitespace-pre-line pb-10">
                      {detailData.synopsis}
                    </p>
                  </div>
                </div>

                <div className="sticky bottom-0 md:relative p-6 md:px-12 md:pb-12 md:pt-4 bg-zinc-900/90 backdrop-blur-md md:backdrop-blur-none border-t border-white/5 md:border-t-0 shrink-0 z-10">
                  <motion.button 
                    whileHover={{ scale: 1.01, backgroundColor: "#ffffff", color: "#000000" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setIsOpen(false);
                      if (bookId) router.push(`/watch/${platform}/${bookId}`);
                    }}
                    className="w-full bg-red-600 text-white py-4 md:py-5 rounded-2xl font-black text-xs tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(220,38,38,0.3)]"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5.14V19.14L19 12.14L8 5.14Z" />
                    </svg>
                    Mulai Menonton
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div onClick={() => setIsOpen(true)} className={variant === "card" ? "cursor-pointer group" : "relative"}>
        {variant === "card" ? children : (
          <div className="cursor-pointer group font-sans">
            <div className="flex items-center gap-2 mb-2">
               <svg className="w-3.5 h-3.5 text-cyan-400 shadow-sm" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
               </svg>
               <span className="text-cyan-400 text-[10px] font-black uppercase tracking-widest">{viewers} Views</span>
            </div>
            <p className="text-zinc-400 text-xs md:text-base line-clamp-2 md:line-clamp-3 leading-relaxed">
            {detailData.synopsis}
          </p>
            <span className="text-white/20 text-[10px] font-black uppercase mt-3 group-hover:text-red-500 transition-colors inline-block tracking-widest">
              Detail Sinopsis →
            </span>
          </div>
        )}
      </div>
      {typeof window !== "undefined" && createPortal(modalLayout, document.body)}
    </>
  );
}