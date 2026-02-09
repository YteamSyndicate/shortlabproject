import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ExpandableText from "@/components/ExpandableText";
import AnimationWrapper from "@/components/AnimationWrapper";
import Pagination from "@/components/Pagination";
import LoadingReset from "@/components/LoadingReset";
import { 
  getTrendingDrama, 
  getLatestDrama, 
  getDramaDubIndo,
  getMeloloHome,
  getMeloloTrending,
  getAllDracinData,
  getMassiveForyou,
  getMassiveDubIndo
} from "@/lib/api";

import { type DramaItem, type DramaSection } from "@/lib/types";

interface NetshortExtended extends DramaItem {
  totalEpisode?: number;
  heatScoreShow?: string;
  labelArray?: string[];
}

interface ImageData {
  cover?: string;
  thumb_url?: string;
  shortPlayCover?: string;
  groupShortPlayCover?: string;
  platform?: string;
}

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1598897349489-bc4746421e5a?q=80&w=1000&auto=format&fit=crop";
const ITEMS_PER_PAGE = 24;

function shuffleItems(array: DramaItem[]) {
  return [...array].sort(() => 0.5 - Math.random());
}

const getImageUrl = (item: ImageData) => {
  let rawUrl = item.cover || item.thumb_url || item.shortPlayCover || item.groupShortPlayCover;
  
  if (!rawUrl || rawUrl === "undefined" || rawUrl === "" || rawUrl === "null") {
    return PLACEHOLDER_IMAGE;
  }
  
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

  return `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&noreferer=1&output=webp&default=${encodeURIComponent(PLACEHOLDER_IMAGE)}`;
};

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1"));
  
  let displayTitle = "KATEGORI";
  let allItems: DramaItem[] = [];
  let isMassiveCategory = false;

  if (slug === "pilihan-untukmu" || slug === "foryou" || slug === "rekomendasi") {
    displayTitle = "Pilihan Untukmu";
    isMassiveCategory = true;
    allItems = await getMassiveForyou(currentPage).catch(() => []);
  } 
  else {
    const [
      trendingDb, trendingMl, 
      latestDb, latestMl, 
      dubIndo,
      allDracinRaw
    ] = await Promise.all([
      getTrendingDrama().catch(() => []),
      getMeloloTrending().catch(() => []),
      getLatestDrama().catch(() => []),
      getMeloloHome().catch(() => []),
      getDramaDubIndo('terpopuler', 1).catch(() => []),
      getAllDracinData().catch(() => []) as Promise<DramaSection[]>
    ]);

    const dracinItems = allDracinRaw.flatMap(section => section.items || []);

    if (slug === "trending-sekarang" || slug === "trending") {
      displayTitle = "Trending Sekarang";
      allItems = [...trendingDb, ...trendingMl];
    } 
    else if (slug === "baru-dirilis" || slug === "latest") {
      displayTitle = "Baru Dirilis";
      allItems = [...latestDb, ...latestMl];
    } 
    else if (slug === "dubbing-indonesia") {
      displayTitle = "Dubbing Indonesia";
      isMassiveCategory = true;
      allItems = await getMassiveDubIndo(currentPage).catch(() => []);
    }
    else {
      displayTitle = slug.replace(/-/g, ' ').toUpperCase();
      const pool = [...trendingDb, ...trendingMl, ...latestDb, ...latestMl, ...dracinItems, ...dubIndo];
      allItems = pool.filter(item => 
        item.genre?.toLowerCase().includes(slug.toLowerCase()) || 
        item.title?.toLowerCase().includes(slug.toLowerCase())
      );
      if (allItems.length === 0) allItems = pool;
    }
  }

  const uniqueMap = new Map<string, DramaItem>();
  allItems.forEach(item => {
    const key = `${item.platform}-${item.bookId}`.toLowerCase();
    if (!uniqueMap.has(key) && item.title) {
      uniqueMap.set(key, item);
    }
  });
  
  const finalItemsPool = Array.from(uniqueMap.values());
  const totalPages = isMassiveCategory ? 50 : Math.ceil(finalItemsPool.length / ITEMS_PER_PAGE); 
  const paginatedItems = isMassiveCategory 
    ? finalItemsPool.slice(0, ITEMS_PER_PAGE)
    : shuffleItems(finalItemsPool).slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
    if (s.includes('K') || s.includes('k') || parseFloat(s) > 10 || !s || s === "0" || s === "undefined" || s === "null") {
      return (9.3 + (index % 6) * 0.1).toFixed(1);
    }
    return parseFloat(s).toFixed(1);
  };

  return (
    <main className="relative min-h-screen bg-black text-white selection:bg-red-600 overflow-x-hidden font-sans">
      <LoadingReset />
      <Navbar />    
      <div className="relative z-10 pt-32 md:pt-44 pb-32 px-6 md:px-12 lg:px-20">
        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-10 overflow-x-auto whitespace-nowrap no-scrollbar">
          <Link href="/" className="hover:text-red-600 transition-colors">Beranda</Link>
          <span className="text-zinc-800 text-xs">/</span>
          <span className="text-red-600">{displayTitle}</span>
        </div>

        <div className="flex items-center gap-2 md:gap-4 mb-12 md:mb-16">
          <div className="w-1 h-8 md:w-1.5 md:h-12 bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.8)] shrink-0" />
          <h1 className="text-3xl md:text-6xl font-black uppercase tracking-tighter leading-none">
            {displayTitle}
          </h1>
          <span className="text-zinc-800 text-xs md:text-lg font-black ml-auto">
            {isMassiveCategory ? "1500+" : finalItemsPool.length} TITLES
          </span>
        </div>

        {paginatedItems.length > 0 ? (
          <>
            <AnimationWrapper key={`${slug}-${currentPage}`}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-16">
                {paginatedItems.map((baseItem, iIdx) => {
                  const item = baseItem as NetshortExtended;
                  const finalScore = sanitizeRating(item.score, iIdx);
                  const imageUrl = getImageUrl(item);
                  const displayGenre = item.genre || (item.labelArray && item.labelArray[0]);
                  const finalIntro = item.intro && item.intro !== "undefined" && item.intro !== "null" && item.intro !== ""
                    ? item.intro 
                    : "Nikmati alur cerita drama pendek terbaik dengan kualitas visual memukau. Saksikan kisah penuh emosi, romansa, dan dendam yang dikemas secara ringkas namun mendalam.";

                  return (
                    <div key={`${item.platform}-${item.bookId}-${iIdx}`} className="w-full">
                      <ExpandableText 
                        {...item} 
                        cover={imageUrl} 
                        platform={item.platform} 
                        tag={displayGenre || "Drama"} 
                        text={finalIntro} 
                        score={finalScore} 
                        variant="card"
                      >
                        <div className="group cursor-pointer">
                          <div className="relative aspect-3/4 overflow-hidden bg-zinc-900 rounded-2xl border border-white/5 transition-all duration-500 shadow-2xl group-hover:border-red-600/50">
                            <Image 
                              src={imageUrl} 
                              alt={item.title || "Cover"} 
                              fill 
                              className="object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" 
                              unoptimized 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-3 left-3 z-30 bg-red-600 text-white text-[9px] md:text-[9px] font-black px-2 py-1 rounded-md uppercase">
                              {item.platform || 'HOT'}
                            </div>
                            <div className="absolute top-3 right-3 z-30 bg-black/60 backdrop-blur-md border border-white/10 text-white px-2 py-1 rounded-md flex items-center gap-1">
                               <span className="text-[9px] md:text-[11px] font-black text-yellow-400">★ {finalScore}</span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-linear-to-t from-black via-black/80 to-transparent flex flex-col justify-end p-4 md:p-5">
                               {displayGenre && (
                                 <div className="mb-1.5">
                                   <span className={`${getGenreBg(displayGenre)} text-white text-[8px] md:text-[9px] font-black uppercase px-2 py-0.5 rounded-sm tracking-widest inline-block shadow-lg`}>
                                     {displayGenre}
                                   </span>
                                 </div>
                               )}
                               <div className="flex items-center gap-2 text-zinc-100 text-[10px] md:text-xs font-black uppercase tracking-widest">
                                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                                  {item.chapterCount && item.chapterCount > 0 
                                    ? `${item.chapterCount} Eps` 
                                    : item.totalEpisode && item.totalEpisode > 0
                                      ? `${item.totalEpisode} Eps` 
                                      : "Full Eps"}
                                </div>
                            </div>
                          </div>
                          <h4 className="mt-4 font-black text-xs md:text-lg text-zinc-100 group-hover:text-red-500 transition-colors line-clamp-1 uppercase tracking-tight">
                            {item.title}
                          </h4>
                        </div>
                      </ExpandableText>
                    </div>
                  );
                })}
              </div>
            </AnimationWrapper>

            {totalPages > 1 && (
              <div className="mt-20">
                <Pagination 
                  currentPage={currentPage} 
                  totalPages={totalPages} 
                  slug={slug} 
                />
              </div>
            )}
          </>
        ) : (
          <div className="h-[60vh] flex flex-col items-center justify-center text-zinc-600 uppercase font-black tracking-[0.3em] px-6 text-center">
            <div className="w-12 h-0.5 bg-red-600 mb-6 animate-pulse" />
            <p className="max-w-xs leading-relaxed text-[10px]">Syncing Data dari {slug}...</p>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}