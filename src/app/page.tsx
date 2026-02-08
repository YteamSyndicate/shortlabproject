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

interface ExtendedDramaItem extends DramaItem {
  shortPlayCover?: string;
  groupShortPlayCover?: string;
  thumb_url?: string;
}

interface MinimalDramaItem {
  shortPlayCover?: string;
  cover?: string;
  groupShortPlayCover?: string;
  thumb_url?: string;
  platform?: string;
}

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

  const getImageUrl = (item: MinimalDramaItem) => {
    let rawUrl = item.cover || item.thumb_url || item.shortPlayCover || item.groupShortPlayCover;
    if (!rawUrl || rawUrl === "undefined" || rawUrl === "" || rawUrl === "null") return PLACEHOLDER_IMAGE;
    
    rawUrl = rawUrl.trim();

    if (item.platform === 'melolo' && !rawUrl.includes('weserv.nl')) {
        return `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&noreferer=1&output=webp`;
    }

    if (rawUrl.includes('fizzopic.org') || rawUrl.includes('ibyteimg.com')) {
      return `https://wsrv.nl/?url=${encodeURIComponent(rawUrl.replace('.heic', '.webp'))}&noreferer=1&n=-1`;
    }
    if ((rawUrl.match(/https?:\/\//g) || []).length > 1) {
      rawUrl = rawUrl.substring(rawUrl.lastIndexOf('http'));
    }
    if (rawUrl.startsWith('//')) rawUrl = `https:${rawUrl}`;
    
    const needsProxy = ['netshort.com', 'farsunpteltd.com', 'flickreels.com'];
    if (needsProxy.some(domain => rawUrl.toLowerCase().includes(domain))) {
      return `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&noreferer=1&output=webp`;
    }
    return rawUrl;
  };

  const getGenreBg = (genre: string) => {
    const g = (genre || "").toUpperCase();
    if (g.includes("CEO")) return "bg-amber-600";
    if (g.includes("ROMANSA")) return "bg-pink-600";
    if (g.includes("DENDAM")) return "bg-purple-700";
    if (g.includes("PERNIKAHAN")) return "bg-emerald-600";
    if (g.includes("KONGLOMERAT")) return "bg-blue-600";
    return "bg-red-600"; 
  };

  const sanitizeRating = (score: string | number | undefined | null, index: number = 0) => {
    const s = String(score || "");
    if (s.includes('K') || s.includes('k') || parseFloat(s) > 10 || !s || s === "0" || s === "undefined") {
      return (9.3 + (index % 6) * 0.1).toFixed(1);
    }
    return parseFloat(s).toFixed(1);
  };

  const isValidDrama = (item: ExtendedDramaItem) => {
    return !!(item && item.title && item.title !== "undefined" && (item.cover || item.thumb_url || item.shortPlayCover));
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

  const dracinSectionsRaw: DramaSection[] = results[0].status === 'fulfilled' ? (results[0].value || []) : [];
  const popularKeywords = results[1].status === 'fulfilled' ? (results[1].value || []) : [];
  const dubIndoRaw: DramaItem[] = results[2].status === 'fulfilled' ? (results[2].value || []) : [];
  const randomPick = results[3].status === 'fulfilled' ? results[3].value : null;
  
  const mlLatest = results[4].status === 'fulfilled' ? (results[4].value || []) : [];
  const mlTrending = results[5].status === 'fulfilled' ? (results[5].value || []) : [];
  const mlForYou = results[6].status === 'fulfilled' ? (results[6].value || []) : [];

  const sectionMap = new Map<string, DramaSection>();

  const mergeToSection = (targetKey: string, meloloItemsRaw: DramaItem[]) => {
    const existing = sectionMap.get(targetKey);
    const dracinItems = existing ? (existing.items as ExtendedDramaItem[]) : [];
    const meloloItems = (meloloItemsRaw as ExtendedDramaItem[] || []).filter(isValidDrama);

    const meloloProcessed = meloloItems.map(item => ({ 
      ...item, 
      platform: item.platform || 'Melolo' 
    }));

    const platformGroups: { [key: string]: ExtendedDramaItem[] } = {};

    dracinItems.forEach(item => {
      const p = item.platform || 'Dramabox';
      if (!platformGroups[p]) platformGroups[p] = [];
      platformGroups[p].push(item);
    });

    if (meloloProcessed.length > 0) {
      if (!platformGroups['Melolo']) platformGroups['Melolo'] = [];
      platformGroups['Melolo'].push(...meloloProcessed);
    }

    const mixedItems: ExtendedDramaItem[] = [];
    const platforms = Object.keys(platformGroups);
 
    for (let i = 0; i < 20; i++) {
      platforms.forEach(p => {
        const item = platformGroups[p][i];
        if (item) mixedItems.push(item);
      });
    }

    const finalItems = mixedItems
      .filter((v, i, a) => a.findIndex(t => t.bookId === v.bookId) === i)
      .slice(0, 10);

    sectionMap.set(targetKey, { 
      title: targetKey, 
      path: getSeeAllHref(targetKey), 
      items: finalItems 
    });
  };

  dracinSectionsRaw.forEach((section) => {
    const validItems = (section.items as ExtendedDramaItem[]).filter(isValidDrama);
    if (validItems.length > 0) {
      sectionMap.set(section.title.trim(), { ...section, items: validItems });
    }
  });

  mergeToSection("Baru Dirilis", mlLatest);
  mergeToSection("Trending Sekarang", mlTrending);
  mergeToSection("Pilihan Untukmu", mlForYou);

  const desiredOrder = ["Trending Sekarang", "Baru Dirilis", "Pilihan Untukmu"];
  const combinedSections = Array.from(sectionMap.values()).sort((a, b) => {
    const idxA = desiredOrder.indexOf(a.title);
    const idxB = desiredOrder.indexOf(b.title);
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  const validDubIndo = (dubIndoRaw as ExtendedDramaItem[]).filter(isValidDrama).slice(0, 10);
 
  let highlight = combinedSections.find(s => s.items && s.items.length > 0)?.items[0];
  if (highlight) {
    highlight = { 
        ...highlight, 
        cover: getImageUrl(highlight),
        score: sanitizeRating(highlight.score, 5)
    };
  }

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
        {combinedSections.map((section, sIdx) => {
          if (!section.items || section.items.length === 0) return null;

          return (
            <section key={`${section.title}-${sIdx}`} className="px-6 md:px-12 lg:px-20">
              <div className="flex items-start justify-between mb-8 md:mb-10 gap-x-4">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-1.5 h-7 md:w-2 md:h-10 bg-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.6)] shrink-0 mt-0.5 md:mt-0" />
                  
                  <h3 className="text-xl md:text-4xl font-black uppercase tracking-tighter leading-tight md:leading-none">
                    {section.title}
                  </h3>
                </div>

                <div className="flex items-center h-7 md:h-10 shrink-0"> 
                  <Link 
                    href={getSeeAllHref(section.title)} 
                    className="group flex items-center gap-2 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 px-4 py-2 rounded-full transition-all duration-300"
                  >
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-zinc-400 group-hover:text-red-500 transition-colors whitespace-nowrap">
                      Lihat Semua
                    </span>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 20 20" 
                      fill="currentColor" 
                      className="w-4 h-4 text-zinc-500 group-hover:text-red-500 group-hover:translate-x-1 transition-all shrink-0"
                    >
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>

              <div className="flex overflow-x-auto gap-4 md:gap-8 pb-10 no-scrollbar scroll-smooth">
                {section.items.map((item: ExtendedDramaItem, iIdx) => {
                  const finalScore = sanitizeRating(item.score, iIdx);
                  const imageUrl = getImageUrl(item);

                  return (
                    <div key={`${item.bookId}-${item.platform}-${iIdx}`} className="min-w-37.5 md:min-w-60">
                      <ExpandableText 
                        {...item} 
                        cover={imageUrl}
                        platform={item.platform}
                        tag={item.genre || "Drama"} 
                        text={item.intro && item.intro !== "undefined" ? item.intro : "Tonton keseruan ceritanya sekarang."} 
                        score={finalScore} 
                        variant="card"
                      >
                        <div className="group cursor-pointer">
                          <div className="relative aspect-3/4 overflow-hidden bg-zinc-900 rounded-2xl border border-white/5 transition-all duration-500 shadow-2xl group-hover:border-red-600/50">
                            <Image src={imageUrl} alt={item.title || "Cover"} fill className="object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" unoptimized referrerPolicy="no-referrer" />
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
                                  {item.chapterCount && item.chapterCount > 0 
                                    ? `${item.chapterCount} Eps` 
                                    : (item.playCount && item.playCount !== "1.2M" ? `${item.playCount} Hot` : "Full Eps")}
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
        {validDubIndo.length > 0 && (
          <section className="px-6 md:px-12 lg:px-20">
            <div className="flex items-center justify-between mb-8 md:mb-10">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="w-1.5 h-7 md:w-2 md:h-10 bg-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.6)] shrink-0 mt-0.5md:mt-0" />
                  
                <h3 className="text-xl md:text-4xl font-black uppercase tracking-tighter leading-tight md:leading-none">
                  DUBBING INDONESIA
                </h3>
              </div>
              <Link 
                href="/category/dubbing-indonesia" 
                className="group flex items-center gap-2 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 px-4 py-2 rounded-full transition-all duration-300"
              >
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-zinc-400 group-hover:text-red-500 transition-colors whitespace-nowrap">
                  Lihat Semua
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-zinc-500 group-hover:text-red-500 group-hover:translate-x-1 transition-all">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>

            <div className="flex overflow-x-auto gap-4 md:gap-8 pb-10 no-scrollbar scroll-smooth">
              {validDubIndo.map((item: ExtendedDramaItem, iIdx) => {
                const finalDubScore = sanitizeRating(item.score, iIdx + 2);
                const imageUrl = getImageUrl(item);

                return (
                  <div key={`dub-${item.bookId}-${iIdx}`} className="min-w-37.5 md:min-w-60">
                    <ExpandableText 
                        {...item} 
                        cover={imageUrl} 
                        platform={item.platform}
                        tag="DUB INDO" 
                        text={item.intro || "Drama seru dengan suara Bahasa Indonesia."} 
                        score={finalDubScore} 
                        variant="card"
                    >
                      <div className="group cursor-pointer">
                        <div className="relative aspect-3/4 overflow-hidden bg-zinc-900 rounded-2xl border border-white/5 transition-all duration-500 shadow-2xl group-hover:border-red-600/50">
                          <Image src={imageUrl} alt={item.title || "Cover"} fill className="object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" unoptimized referrerPolicy="no-referrer" />
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