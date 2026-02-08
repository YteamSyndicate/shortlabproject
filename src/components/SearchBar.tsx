'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get('q');

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsSearching(false);
      if (currentQuery) {
        setQuery(currentQuery);
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [currentQuery]); 

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsSearching(true);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  if (!mounted) {
    return <div className="w-full h-14.5 bg-zinc-900/50 rounded-xl animate-pulse" />;
  }

  return (
    <form onSubmit={handleSearch} className="w-full relative">
      <div className="relative group">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari drama, judul, atau genre..."
          disabled={isSearching}
          className={`w-full bg-zinc-900/50 border border-zinc-800 text-white px-6 py-4 rounded-xl focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all pl-14 shadow-2xl backdrop-blur-md ${
            isSearching ? 'opacity-50' : 'opacity-100'
          }`}
        />
        <div className="absolute left-5 top-1/2 -translate-y-1/2">
          {isSearching ? (
            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 text-zinc-500 group-focus-within:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>
    </form>
  );
}