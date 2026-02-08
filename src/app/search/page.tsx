import { searchAllPlatforms } from "@/lib/api";
import { type DramaItem } from "@/lib/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ExpandableText from "@/components/ExpandableText";
import AnimationWrapper from "@/components/AnimationWrapper"; 
import SearchBar from "@/components/SearchBar";
import Image from "next/image";
import Link from "next/link";

interface SearchDramaItem extends DramaItem {
  bookCover?: string;
  playCount?: string;
  thumb_url?: string;
  shortPlayCover?: string;
  groupShortPlayCover?: string;
  horizontalCover?: string;
  chapterCount?: number;
}

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1598897349489-bc4746421e5a?q=80&w=1000&auto=format&fit=crop";

const getImageUrl = (item: SearchDramaItem) => {
  let rawUrl = item.cover || 
               item.bookCover || 
               item.thumb_url || 
               item.shortPlayCover || 
               item.groupShortPlayCover || 
               item.horizontalCover || 
               "";
  
  if (!rawUrl || rawUrl === "undefined" || rawUrl === "" || rawUrl === "null") {
    return PLACEHOLDER_IMAGE;
  }
  
  rawUrl = rawUrl.trim();

  if (item.platform === 'melolo' && !rawUrl.includes('wsrv.nl')) {
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

const getGenreBg = (genre: string) => {
  const g = (genre || "").toUpperCase();
  if (g.includes("CEO")) return "bg-amber-600";
  if (g.includes("ROMANSA")) return "bg-pink-600";
  if (g.includes("DENDAM") || g.includes("PEMBALASAN")) return "bg-red-600";
  if (g.includes("PERNIKAHAN")) return "bg-emerald-600";
  if (g.includes("KONGLOMERAT") || g.includes("PEWARIS")) return "bg-blue-600";
  return "bg-zinc-800"; 
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: query } = await searchParams;
  let results: SearchDramaItem[] = [];

  if (query) {
    const data = await searchAllPlatforms(query);
    results = data as SearchDramaItem[];
  }

  return (
    <main className="min-h-screen bg-black text-white selection:bg-red-600 overflow-x-hidden font-sans">
      <Navbar />

      <div className="pt-32 md:pt-40 pb-32 px-6 md:px-12 lg:px-20">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-10 overflow-x-auto whitespace-nowrap no-scrollbar">
          <Link href="/" className="hover:text-red-600 transition-colors">Beranda</Link>
          <span className="text-zinc-800 text-xs">/</span>
          <span className="text-red-500">Hasil Pencarian</span>
        </div>

        <div className="flex flex-col mb-16 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
              <h2 className="text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] text-zinc-500">
                Hasil Pencarian
              </h2>
            </div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
              &quot;{query || "Semua"}&quot;
            </h1>
          </div>

          <div className="w-full max-w-2xl">
            <SearchBar />
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-4">
              Ditemukan {results.length} Judul
            </p>
          </div>
        </div>

        {results.length > 0 ? (
          <AnimationWrapper key={query}> 
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-12">
              {results.map((item, index) => {
                const imageUrl = getImageUrl(item);
                const finalScore = item.score && !["9.5", "0", ""].includes(item.score) 
                                   ? item.score 
                                   : (9.2 + (index % 8) * 0.1).toFixed(1);

                return (
                  <div key={`${item.platform}-${item.bookId}-${index}`}>
                    <ExpandableText
                      {...item}
                      cover={imageUrl}
                      platform={item.platform}
                      tag={item.genre || item.tag || "Drama"}
                      text={item.intro && item.intro !== "undefined" ? item.intro : "Tonton keseruan ceritanya sekarang."}
                      score={finalScore}
                      variant="card"
                    >
                      <div className="group cursor-pointer">
                        {/* Container Cover identik Homepage */}
                        <div className="relative aspect-3/4 overflow-hidden bg-zinc-900 rounded-2xl border border-white/5 transition-all duration-500 shadow-2xl group-hover:border-red-600/50">
                          <Image 
                            src={imageUrl} 
                            alt={item.title || "Cover"} 
                            fill 
                            className="object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" 
                            unoptimized 
                            referrerPolicy="no-referrer"
                          />
                          
                          {/* Badge Platform (Top Left) */}
                          <div className="absolute top-3 left-3 z-30 bg-red-600 text-white text-[8px] md:text-[10px] font-black px-2 py-1 rounded-md uppercase">
                            {item.platform || 'HOT'}
                          </div>

                          {/* Rating */}
                          <div className="absolute top-3 right-3 z-30 bg-black/60 backdrop-blur-md border border-white/10 text-white px-2 py-1 rounded-md flex items-center gap-1">
                             <span className="text-[9px] md:text-[11px] font-black text-yellow-400">★ {finalScore}</span>
                          </div>

                          {/* Gradient and Info Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-linear-to-t from-black via-black/80 to-transparent flex flex-col justify-end p-4 md:p-5">
                             {item.genre && (
                               <div className="mb-1.5">
                                 <span className={`${getGenreBg(item.genre)} text-white text-[7px] md:text-[9px] font-black uppercase px-2 py-0.5 rounded-sm tracking-widest inline-block shadow-lg`}>
                                   {item.genre}
                                 </span>
                               </div>
                             )}
                             
                             <div className="flex items-center gap-2 text-zinc-100 text-[10px] md:text-xs font-black uppercase tracking-widest">
                               <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                               {item.chapterCount && item.chapterCount > 0 
                                 ? `${item.chapterCount} Eps` 
                                 : (item.playCount && !item.playCount.includes("M") 
                                     ? `${item.playCount} Hot` 
                                     : "Full Eps")}
                             </div>
                          </div>
                        </div>

                        {/* Title Section */}
                        <h4 className="mt-4 font-black text-xs md:text-sm text-zinc-100 group-hover:text-red-500 transition-colors line-clamp-2 uppercase tracking-tight">
                          {item.title}
                        </h4>
                      </div>
                    </ExpandableText>
                  </div>
                );
              })}
            </div>
          </AnimationWrapper>
        ) : (
          <div className="h-[40vh] flex flex-col items-center justify-center text-zinc-700 uppercase font-bold tracking-[0.3em] text-center">
              <p className="text-[10px]">Judul tidak ditemukan</p>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}