"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

// --- MODAL COMPONENT ---
function Modal({ isOpen, onClose, title, content }: { isOpen: boolean; onClose: () => void; title: string; content: string }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative bg-zinc-900/50 border border-white/10 w-full max-w-xl max-h-[70vh] overflow-hidden rounded-2xl p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_20px_rgba(220,38,38,0.1)] backdrop-blur-2xl flex flex-col font-sans"
          >
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-red-600 group transition-colors"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </motion.button>

            <div className="flex items-center gap-4 mb-8 shrink-0">
              <div className="w-1.5 h-8 bg-red-600 rounded-full" />
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white drop-shadow-md">{title}</h2>
            </div>

            <div className="text-zinc-300 text-sm leading-relaxed space-y-4 tracking-wide font-medium overflow-y-auto pr-4 custom-scrollbar">
              {content.split('\n').map((line, i) => (
                <p key={i} className="opacity-80 text-justify">
                  {line}
                </p>
              ))}
            </div>

            <div className="mt-10 pt-6 border-t border-white/5 shrink-0">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full bg-red-600 text-white py-4 rounded-xl font-black text-[11px] tracking-[0.2em] uppercase hover:bg-white hover:text-black shadow-lg shadow-red-600/20 transition-all"
              >
                MENGERTI & TUTUP
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// --- MAIN FOOTER COMPONENT ---
export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [activeModal, setActiveModal] = useState({ isOpen: false, title: "", content: "" });

  const handleOpenModal = (type: string) => {
    const modalContent: Record<string, string> = {
      'FAQ': "Pertanyaan yang sering diajukan:\n1. Apakah layanan ini gratis? Ya, kami menyediakan konten gratis dengan iklan.\n2. Bagaimana cara berlangganan? Klik tombol premium di navigasi.\n3. Apakah ada subtitle Indonesia? Seluruh konten kami memiliki takarir Bahasa Indonesia resmi.",
      'Pusat Bantuan': "Tim dukungan kami tersedia 24/7. Hubungi kami melalui email di support@shortlab.com. Kami akan merespons dalam waktu maksimal 1x24 jam.",
      'Kontak': "Jl. Teknologi Asia No. 101, Bandung.\nEmail: hello@shortlab.com\nTelepon: (021) 555-DRAMA",
      'Status Server': "Sistem Operasional: 99.9% AKTIF\nSemua server berfungsi normal.",
      'Kebijakan Privasi': "Data Anda aman. Kami tidak menjual informasi pribadi kepada pihak ketiga.",
      'Syarat Layanan': "Gunakan layanan ini secara bijak untuk penggunaan pribadi.",
      'Kebijakan Cookie': "Kami menggunakan cookie untuk meningkatkan pengalaman tontonan Anda.",
      'Lisensi': "Konten berlisensi resmi dari mitra studio internasional."
    };

    setActiveModal({
      isOpen: true,
      title: type,
      content: modalContent[type] || "Informasi sedang diperbarui."
    });
  };

  return (
    <footer className="bg-[#050505] border-t border-white/5 pt-20 pb-10 px-6 md:px-12 lg:px-20 relative z-30 font-sans">
      <Modal 
        isOpen={activeModal.isOpen} 
        onClose={() => setActiveModal(prev => ({ ...prev, isOpen: false }))}
        title={activeModal.title}
        content={activeModal.content}
      />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-12 gap-x-8 mb-16">
          <div className="col-span-2 lg:col-span-2 flex flex-col items-center lg:items-start">          
            <Link href="/" className="flex justify-center lg:justify-start w-full group mb-4">
              <Image 
                src="/logo_SL.png" 
                alt="SHORTLAB Logo" 
                width={220}
                height={80} 
                className="object-contain"
              />
            </Link>

            <p className="text-zinc-500 text-[9px] font-black leading-relaxed uppercase tracking-[0.3em] max-w-70 mb-10 text-center lg:text-justify opacity-80">
              Drama tidak butuh durasi untuk menjadi besar. Kami mengemas seluruh emosi 
              manusia ke dalam kapsul waktu yang singkat, padat, dan tak terlupakan.
            </p>

            <div className="flex gap-3 justify-center lg:justify-start w-full">
              {['IG', 'TW', 'FB', 'YT'].map((social) => (
                <motion.div 
                  key={social} 
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-9 h-9 rounded-xl border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:border-red-600 hover:bg-red-600/20 cursor-pointer transition-all"
                >
                  <span className="text-[10px] font-black">{social}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {[
            { title: 'Jelajahi', links: ['Beranda', 'Serial Drama', 'Film Original', 'Trending'] },
            { title: 'Bantuan', links: ['FAQ', 'Pusat Bantuan', 'Kontak', 'Status Server'] },
            { title: 'Legalitas', links: ['Kebijakan Privasi', 'Syarat Layanan', 'Kebijakan Cookie', 'Lisensi'] }
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-white text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <span className="w-1 h-3 bg-red-600 rounded-full" />
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((item) => (
                  <li key={item}>
                    <motion.button 
                      whileHover={{ scale: 1.1, x: 5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleOpenModal(item)}
                      className="text-zinc-500 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest text-left"
                    >
                      {item}
                    </motion.button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 ">
            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">
              © {currentYear} SHORTLAB. 
            </p>
            
            <p className="text-[9px] font-black uppercase tracking-[0.2em] mt-4 md:mt-0">
              <span className="text-zinc-800">Built in </span>
              <span className="text-zinc-500 hover:text-red-600 transition-colors duration-500 cursor-default">Java</span>
              <span className="text-zinc-800 ml-2">with ❤️</span>
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="block text-white text-[10px] font-black uppercase leading-none">100% FREE ACCESS</span>
              <span className="text-zinc-700 text-[8px] font-medium uppercase tracking-[0.2em]">High Bitrate Streaming</span>
            </div>
            
            <motion.div 
              whileHover={{ scale: 1.2, rotate: 90 }}
              className="w-10 h-10 border border-white/5 flex items-center justify-center rounded-xl rotate-45 group hover:border-red-600 cursor-pointer transition-colors"
            >
              <div className="w-2 h-2 bg-red-600 rounded-full group-hover:scale-150 transition-transform shadow-[0_0_15px_rgba(220,38,38,0.8)]"></div>
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  );
}