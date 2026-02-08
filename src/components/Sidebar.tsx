"use client";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const currentYear = new Date().getFullYear();

  const navMenus = [
    { name: 'Beranda', href: '/' },
    { name: 'Trending', href: '/category/trending-sekarang' },
    { name: 'Terbaru', href: '/category/baru-rilis' },
    { name: 'Dub Indo', href: '/category/dubindo' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-110"
            onClick={onClose}
          />

          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 right-0 h-full w-80 bg-zinc-950 border-l border-white/5 z-120 p-10 flex flex-col justify-between font-sans"
          >
            <div>
              <button 
                onClick={onClose} 
                className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
                aria-label="Close Sidebar"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
              
              <div className="flex flex-col gap-8 mt-16">
                {navMenus.map((m) => (
                  <Link 
                    key={m.name} 
                    href={m.href} 
                    onClick={onClose} 
                    className="text-sm font-black uppercase tracking-[0.3em] text-zinc-400 hover:text-red-600 transition-all hover:translate-x-2 flex items-center group"
                  >
                    {/* Variasi: Tambahkan titik merah kecil saat hover agar lebih "Shortlab" */}
                    <span className="w-0 h-1 bg-red-600 mr-0 group-hover:w-3 group-hover:mr-3 transition-all duration-300 rounded-full" />
                    {m.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="text-center">
                <div className="w-full flex justify-center opacity-30 group">
                  <Link href="/" onClick={onClose} className="inline-block">
                    <Image 
                      src="/logo_SL.png" 
                      alt="SHORTLAB Logo" 
                      width={150}
                      height={100} 
                      className="object-contain"
                    />
                  </Link>
                </div>
              </div>
              <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.2em] text-center">
                © {currentYear} SHORTLAB ENTERTAINMENT.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}