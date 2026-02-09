"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLoading } from "@/components/LoadingContext";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  slug: string;
}

export default function Pagination({ currentPage, totalPages, slug }: PaginationProps) {
  const router = useRouter();
  const { setIsLoading } = useLoading();

  const handleNav = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setIsLoading(true);
    router.push(href);
  };

  const showMax = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = startPage + showMax - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - showMax + 1);
  }

  return (
    <div className="mt-24 flex flex-col items-center gap-8">
      <div className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">
        Page <span className="text-red-600">{currentPage}</span> / {totalPages}
      </div>

      <div className="flex items-center justify-center gap-2 md:gap-4">
        {/* Tombol Prev */}
        {currentPage > 1 ? (
          <Link
            href={`/category/${slug}?page=${currentPage - 1}`}
            onClick={(e) => handleNav(e, `/category/${slug}?page=${currentPage - 1}`)}
            className="flex h-10 md:h-12 px-4 md:px-6 items-center justify-center rounded-xl font-black text-[10px] uppercase bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:border-red-600 transition-all shadow-xl"
          >
            ← <span className="hidden md:inline ml-2 tracking-widest">Prev</span>
          </Link>
        ) : (
          <div className="flex h-10 md:h-12 px-4 md:px-6 items-center justify-center rounded-xl font-black text-[10px] uppercase bg-zinc-900/50 border border-white/5 text-zinc-800 cursor-not-allowed">
            ← <span className="hidden md:inline ml-2 tracking-widest">Prev</span>
          </div>
        )}

        {/* Angka-angka */}
        <div className="flex items-center gap-2">
          {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((pageNum) => (
            <Link
              key={`page-${pageNum}`}
              href={`/category/${slug}?page=${pageNum}`}
              onClick={(e) => handleNav(e, `/category/${slug}?page=${pageNum}`)}
              className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl font-black text-xs transition-all duration-500 border ${
                currentPage === pageNum
                  ? "bg-red-600 border-red-600 text-white shadow-[0_0_30px_rgba(220,38,38,0.6)] scale-110 z-10"
                  : "bg-zinc-900 border-white/5 text-zinc-500 hover:border-red-600/50 hover:text-white"
              }`}
            >
              {pageNum}
            </Link>
          ))}
        </div>

        {/* Tombol Next */}
        {currentPage < totalPages ? (
          <Link
            href={`/category/${slug}?page=${currentPage + 1}`}
            onClick={(e) => handleNav(e, `/category/${slug}?page=${currentPage + 1}`)}
            className="flex h-10 md:h-12 px-4 md:px-6 items-center justify-center rounded-xl font-black text-[10px] uppercase bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:border-red-600 transition-all shadow-xl"
          >
            <span className="hidden md:inline mr-2 tracking-widest">Next</span> →
          </Link>
        ) : (
          <div className="flex h-10 md:h-12 px-4 md:px-6 items-center justify-center rounded-xl font-black text-[10px] uppercase bg-zinc-900/50 border border-white/5 text-zinc-800 cursor-not-allowed">
            <span className="hidden md:inline mr-2 tracking-widest">Next</span> →
          </div>
        )}
      </div>
    </div>
  );
}