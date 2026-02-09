"use client";
import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLoading } from "@/components/LoadingContext";

export default function Navbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { setIsLoading } = useLoading();
  const router = useRouter();

  const navMenus = [
    { name: 'Beranda', href: '/' },
    { name: 'Rekomendasi', href: '/category/pilihan-untukmu' },
    { name: 'Trending', href: '/category/trending-sekarang' },
    { name: 'Terbaru', href: '/category/baru-rilis' },
    { name: 'Dub Indo', href: '/category/dubindo' },
  ];

  const handleNavigation = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setIsLoading(true);
    router.push(href);
  };

  return (
    <>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <nav className="fixed top-0 w-full z-100 px-6 md:px-12 lg:px-20 py-4 md:py-6 flex items-center justify-between bg-black/20 backdrop-blur-xl border-b border-white/5 transition-all duration-300 hover:bg-black/60 font-sans">
        <Link 
          href="/" 
          className="flex items-center gap-3 group"
          onClick={(e) => handleNavigation(e, "/")}
        >
          <Image 
            src="/logo_SL.png" 
            alt="SHORTLAB Logo" 
            width={120}
            height={100} 
            style={{ height: 'auto', width: 'auto' }}
            className="object-contain"
          />
        </Link>

        <div className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
          {navMenus.map((m) => (
            <Link 
              key={m.name} 
              href={m.href} 
              onClick={(e) => handleNavigation(e, m.href)}
              className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 hover:text-red-600 transition-all hover:scale-105"
            >
              {m.name}
            </Link>
          ))}
        </div>

        {/* MOBILE HAMBURGER */}
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          className="md:hidden group flex flex-col gap-1.5 p-2"
          aria-label="Open Menu"
        >
          <div className="w-6 h-0.5 bg-white group-hover:bg-red-600 transition-all"></div>
          <div className="w-4 h-0.5 bg-white group-hover:bg-red-600 transition-all self-end"></div>
          <div className="w-6 h-0.5 bg-white group-hover:bg-red-600 transition-all"></div>
        </button>

        {/* SPACER FOR BALANCE */}
        <div className="hidden md:block min-w-37.5"></div>
      </nav>
    </>
  );
}