import { getDramaDetail } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WatchClient from "./WatchClient";

interface PageProps {
  params: Promise<{ id: string; path: string }>;
}

export default async function WatchPage({ params }: PageProps) {
  const resolvedParams = await params;
  const bookId = resolvedParams.id;
  const platform = resolvedParams.path;

  const drama = await getDramaDetail(platform, bookId);

  if (!drama) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center font-sans">
        <div className="w-16 h-1.5 bg-red-600 mb-8 shadow-[0_0_20px_#dc2626]" />
        <h2 className="text-4xl md:text-6xl font-black text-white mb-4 uppercase tracking-tighter">Data Error</h2>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.3em] mb-10">
          Drama tidak ditemukan atau link salah.
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white selection:bg-red-600 overflow-x-hidden font-sans">
      <Navbar />
      <WatchClient drama={drama} />
      <Footer />
    </main>
  );
}