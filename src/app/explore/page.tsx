import Image from "next/image";
import Link from "next/link";
import { 
  getAllDracinData, 
  getPopulerSearch, 
  getDramaDubIndo, 
  getRandomDrama,
  getMeloloHome,
  getMeloloTrending,
  getMeloloForYou,
} from "@/lib/api";

import { DramaSection, DramaItem } from "@/lib/types";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ExpandableText from "@/components/ExpandableText";
import HeroUI from "@/components/HeroUI";

/**
 * PENGATURAN METADATA
 * Menghapus Referrer agar server gambar (Melolo/Netshort) tidak memblokir request.
 */
export const metadata = {
  referrer: 'no-referrer',
};

export const revalidate = 0;

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1598897349489-bc4746421e5a?q=80&w=1000&auto=format&fit=crop";

export default async function HomePage() {
  const getSeeAllHref = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("trending")) return "/category/trending-sekarang";
    if (t.includes("baru") || t.includes("latest")) return "/category/baru-dirilis";
    if (t.includes("pilihan") || t.includes("untukmu")) return "/category/pilihan-untukmu";
    if (t.includes("dubbing")) return "/category/dubbing-indonesia";
    return `/category/${t.replace(/\s+/g, '-')}`;
  };

  /**
   * FIX COVER: Menggunakan wsrv.nl sebagai proxy gambar.
   * Fungsi ini membersihkan URL dan membungkusnya agar bisa diakses tanpa blokir.
   */
  const getImageUrl = (item: DramaItem) => {
    if (!item.cover) return PLACEHOLDER_IMAGE;
    
    // Pastikan URL bersih dan memiliki protokol
    let rawUrl = item.cover.trim();
    if (rawUrl.startsWith('//')) {
      rawUrl = `https:${rawUrl}`;
    }

    // Pembersihan double slash kecuali pada protokol
    const cleanUrl = rawUrl.replace(/([^:])\/\//g, '$1/');
    
    // Jika dari dramabox biasanya aman, tapi untuk konsistensi kita gunakan proxy untuk semua non-dramabox
    if (item.platform === 'dramabox' && cleanUrl.startsWith('http')) {
      return cleanUrl;
    }
    
    // Menggunakan wsrv.nl (lebih handal dibanding images.weserv.nl untuk beberapa kasus)
    return `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}&default=${encodeURIComponent(PLACEHOLDER_IMAGE)}&n=-1`;
  };

  const results = await Promise.allSettled([
    getAllDracinData(),
    getPopulerSearch(),
    getDramaDubIndo('terpopuler', 1),
    getRandomDrama(),
    getMeloloHome(),
    getMeloloTrending(),
    getMeloloForYou()
  ]);

  const dracinSections: DramaSection[] = results[0].status === 'fulfilled' ? (results[0].value || []) : [];
  const popularKeywords = results[1].status === 'fulfilled' ? (results[1].value || []) : [];
  const randomPick = results[3].status === 'fulfilled' ? results[3].value : null;
  const dubIndo: DramaItem[] = results[2].status === 'fulfilled' ? (results[2].value || []) : [];
  
  const mlLatest = results[4].status === 'fulfilled' ? (results[4].value || []) : [];
  const mlTrending = results[5].status === 'fulfilled' ? (results[5].value || []) : [];
  const mlForYou = results[6].status === 'fulfilled' ? (results[6].value || []) : [];

  const sectionMap = new Map<string, DramaSection>();

  dracinSections.forEach((section: DramaSection) => {
    sectionMap.set(section.title.trim(), { ...section });
  });

  const mergeToSection = (targetKey: string, sourceData: DramaItem[] | DramaSection | null) => {
    if (!sourceData) return;
    const existing = sectionMap.get(targetKey);
    const newItems = Array.isArray(sourceData) ? sourceData : (sourceData.items || []);

    if (existing) {
      const combined = [...(existing.items || []), ...newItems];
      existing.items = combined.filter((v, i, a) => 
        a.findIndex(t => t.bookId === v.bookId) === i
      ).slice(0, 24);
    } else if (newItems.length > 0) {
      sectionMap.set(targetKey, {
        title: targetKey,
        path: getSeeAllHref(targetKey),
        items: newItems.slice(0, 24)
      });
    }
  };

  mergeToSection("Baru Dirilis", mlLatest as unknown as DramaItem[]);
  mergeToSection("Trending Sekarang", mlTrending as unknown as DramaItem[]);
  mergeToSection("Pilihan Untukmu", mlForYou as unknown as DramaItem[]);

  const desiredOrder = ["Trending Sekarang", "Baru Dirilis", "Pilihan Untukmu"];
  const combinedSections = Array.from(sectionMap.values()).sort((a, b) => {
    const idxA = desiredOrder.indexOf(a.title);
    const idxB = desiredOrder.indexOf(b.title);
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  const highlight = combinedSections.find(s => s.items && s.items.length > 0)?.items[0];

  const getGenreBg = (genre: string) => {
    const g = (genre || "").toUpperCase();
    if (g.includes("CEO")) return "bg-amber-600";
    if (g.includes("ROMANSA")) return "bg-pink-600";
    if (g.includes("DENDAM")) return "bg-purple-700";
    if (g.includes("PERNIKAHAN")) return "bg-emerald-600";
    return "bg-red-600"; 
  };

  return (
    <main className="relative min-h-screen bg-black text-white selection:bg-red-600 overflow-x-hidden font-sans">
      <Navbar />
      
      <section className="relative w-full">
        {highlight ? (
          <HeroUI highlight={highlight} randomPick={randomPick} popularKeywords={popularKeywords} />
        ) : (
          <div className="h-[60vh] flex flex-col items-center justify-center text-zinc-600 uppercase font-black tracking-[0.3em] px-6 text-center">
            <div className="w-12 h-0.5 bg-red-600 mb-6 animate-pulse" />
            <p className="max-w-xs leading-relaxed text-[10px]">Syncing Data...</p>
          </div>
        )}
      </section>

      <div className="relative z-10 space-y-20 md:space-y-28 pb-32 pt-10 md:pt-16">
        {combinedSections.map((section: DramaSection, sIdx: number) => {
          if (!section.items || section.items.length === 0) return null;

          return (
            <section key={`${section.title}-${sIdx}`} className="px-6 md:px-12 lg:px-20">
              <div className="flex items-center justify-between mb-8 md:mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-10 bg-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.6)]" />
                  <h3 className="text-xl md:text-4xl font-black uppercase tracking-tighter leading-none">
                    {section.title}
                  </h3>
                </div>
                <Link 
                  href={getSeeAllHref(section.title)} 
                  className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-red-500 transition-colors border-b border-zinc-800 pb-1"
                >
                  Lihat Semua
                </Link>
              </div>

              <div className="flex overflow-x-auto gap-4 md:gap-8 pb-10 no-scrollbar scroll-smooth">
                {section.items.map((item: DramaItem, iIdx: number) => {
                  const viewCount = (1.0 + (iIdx % 4) * 0.3).toFixed(1);
                  const dynamicScore = (9.2 + (iIdx % 8) * 0.1).toFixed(1);
                  const finalScore = item.score && item.score !== "9.5" && item.score !== "9.8" ? item.score : dynamicScore;
                  const imageUrl = getImageUrl(item);

                  return (
                    <div key={`${item.bookId}-${iIdx}`} className="min-w-37.5 md:min-w-60">
                      <ExpandableText {...item} tag={item.genre || "Drama"} text={item.intro || "Tonton keseruan ceritanya sekarang."} score={finalScore} variant="card">
                        <div className="group cursor-pointer">
                          <div className="relative aspect-3/4 overflow-hidden bg-zinc-900 rounded-2xl border border-white/5 transition-all duration-500 shadow-2xl group-hover:border-red-600/50">
                            <Image 
                               src={imageUrl} 
                               alt={item.title} 
                               fill 
                               className="object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" 
                               unoptimized 
                               referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-3 left-3 z-30 bg-red-600 text-white text-[8px] md:text-[10px] font-black px-2 py-1 rounded-md uppercase">{item.platform || 'HOT'}</div>
                            <div className="absolute top-3 right-3 z-30 bg-black/60 backdrop-blur-md border border-white/10 text-white px-2 py-1 rounded-md flex items-center gap-1">
                               <span className="text-[9px] md:text-[11px] font-black text-yellow-400">★ {finalScore}</span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-linear-to-t from-black via-black/80 to-transparent flex flex-col justify-end p-4 md:p-5">
                               {item.genre && (
                                 <div className="mb-1.5">
                                   <span className={`${getGenreBg(item.genre)} text-white text-[7px] md:text-[9px] font-black uppercase px-2 py-0.5 rounded-sm tracking-widest inline-block shadow-lg`}>{item.genre}</span>
                                 </div>
                               )}
                               <div className="flex items-center gap-2 text-zinc-100 text-[10px] md:text-xs font-black uppercase tracking-widest">
                                 <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                                 {item.chapterCount && item.chapterCount > 0 ? `${item.chapterCount} Eps` : `${viewCount}M Views`}
                               </div>
                            </div>
                          </div>
                          <h4 className="mt-4 font-black text-xs md:text-lg text-zinc-100 group-hover:text-red-500 transition-colors line-clamp-1 uppercase tracking-tight">{item.title}</h4>
                        </div>
                      </ExpandableText>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Section Dubbing Indonesia */}
        {dubIndo && dubIndo.length > 0 && (
          <section className="px-6 md:px-12 lg:px-20">
            <div className="flex items-center justify-between mb-8 md:mb-10">
              <div className="flex items-center gap-4">
                <div className="w-2 h-10 bg-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.6)]" />
                <h3 className="text-xl md:text-4xl font-black uppercase tracking-tighter leading-none">
                  Dubbing Indonesia
                </h3>
              </div>
              <Link href="/category/dubbing-indonesia" className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-red-500 transition-colors border-b border-zinc-800 pb-1">
                Lihat Semua
              </Link>
            </div>

            <div className="flex overflow-x-auto gap-4 md:gap-8 pb-10 no-scrollbar scroll-smooth">
              {dubIndo.map((item: DramaItem, iIdx: number) => {
                const dynamicScore = (9.3 + (iIdx % 7) * 0.1).toFixed(1);
                const finalDubScore = item.score && item.score !== "9.5" ? item.score : dynamicScore;
                const imageUrl = getImageUrl(item);

                return (
                  <div key={`dub-${item.bookId}-${iIdx}`} className="min-w-37.5 md:min-w-60">
                    <ExpandableText {...item} tag="DUB INDO" text={item.intro || "Drama seru dengan suara Bahasa Indonesia."} score={finalDubScore} variant="card">
                      <div className="group cursor-pointer">
                        <div className="relative aspect-3/4 overflow-hidden bg-zinc-900 rounded-2xl border border-white/5 transition-all duration-500 shadow-2xl group-hover:border-red-600/50">
                          <Image 
                            src={imageUrl} 
                            alt={item.title} 
                            fill 
                            className="object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" 
                            unoptimized 
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-3 left-3 z-30 bg-red-600 text-white text-[8px] md:text-[10px] font-black px-2 py-1 rounded-md uppercase">DUB INDO</div>
                          <div className="absolute top-3 right-3 z-30 bg-black/60 backdrop-blur-md border border-white/10 text-white px-2 py-1 rounded-md flex items-center gap-1 shadow-lg group-hover:scale-110 transition-transform">
                            <span className="text-[9px] md:text-[11px] font-black text-yellow-400">★ {finalDubScore}</span>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-linear-to-t from-black via-black/80 to-transparent flex flex-col justify-end p-4 md:p-5">
                            <div className="mb-1.5">
                              <span className="bg-red-600 text-white text-[7px] md:text-[9px] font-black uppercase px-2 py-0.5 rounded-sm tracking-widest inline-block">AUDIO INDO</span>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-100 text-[10px] md:text-xs font-black uppercase tracking-widest">
                              <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                              {item.chapterCount ? `${item.chapterCount} Eps` : "Full Episode"}
                            </div>
                          </div>
                        </div>
                        <h4 className="mt-4 font-black text-xs md:text-lg text-zinc-100 group-hover:text-red-500 transition-colors line-clamp-1 uppercase tracking-tight">{item.title}</h4>
                      </div>
                    </ExpandableText>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
      <Footer />
    </main>
  );
}