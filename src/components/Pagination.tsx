"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  slug: string;
}

export default function Pagination({ currentPage, totalPages, slug }: PaginationProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleNav = (pageNum: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    startTransition(() => {
      router.push(`/category/${slug}?page=${pageNum}`);
    });
  };

  const showMax = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = startPage + showMax - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - showMax + 1);
  }

  return (
    <div className={`mt-24 flex flex-col items-center gap-8 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">
        {isPending ? (
          <span className="text-red-600 animate-pulse">Syncing Content...</span>
        ) : (
          <>
            Page <span className="text-red-600">{currentPage}</span> / {totalPages}
          </>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 md:gap-4">
        <button
          onClick={() => handleNav(currentPage - 1)}
          disabled={currentPage <= 1 || isPending}
          className="flex h-10 md:h-12 px-4 md:px-6 items-center justify-center rounded-xl font-black text-[10px] uppercase bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:border-red-600 transition-all shadow-xl disabled:opacity-20 disabled:cursor-not-allowed"
        >
          ← <span className="hidden md:inline ml-2 tracking-widest">Prev</span>
        </button>

        <div className="flex items-center gap-2">
          {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((pageNum) => (
            <button
              key={`page-${pageNum}`}
              onClick={() => handleNav(pageNum)}
              disabled={isPending}
              className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl font-black text-xs transition-all duration-500 border ${
                currentPage === pageNum
                  ? "bg-red-600 border-red-600 text-white shadow-[0_0_30px_rgba(220,38,38,0.6)] scale-110 z-10"
                  : "bg-zinc-900 border-white/5 text-zinc-500 hover:border-red-600/50 hover:text-white"
              } disabled:opacity-50`}
            >
              {pageNum}
            </button>
          ))}
        </div>

        <button
          onClick={() => handleNav(currentPage + 1)}
          disabled={currentPage >= totalPages || isPending}
          className="flex h-10 md:h-12 px-4 md:px-6 items-center justify-center rounded-xl font-black text-[10px] uppercase bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:border-red-600 transition-all shadow-xl disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <span className="hidden md:inline mr-2 tracking-widest">Next</span> →
        </button>
      </div>
    </div>
  );
}