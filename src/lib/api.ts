import { DramaItem, DramaSection, DramaDetail, PlatformType, MeloloBook, MeloloResponse } from "./types";
import { mapDramaData } from "./mapper";
import { StreamPayload } from "@/utils/streamResolver";

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:3000";
};

function safeExtractList(data: unknown, label?: string): Record<string, unknown>[] {
  if (!data || typeof data !== 'object') return [];
  
  let result: Record<string, unknown>[] = [];
  const root = data as Record<string, unknown>;

  try {
    if (Array.isArray(data)) {
      return data as Record<string, unknown>[];
    } 
    
    if (root.searchCodeSearchResult && Array.isArray(root.searchCodeSearchResult)) {
      result = root.searchCodeSearchResult as Record<string, unknown>[];
    }
    else if (root.data && Array.isArray(root.data)) {
      result = root.data as Record<string, unknown>[];
    }
    else if (root.results && Array.isArray(root.results)) {
      result = root.results as Record<string, unknown>[];
    }
    else if (root.data && typeof root.data === 'object' && root.data !== null) {
      const dc = root.data as Record<string, unknown>;
      const keys = ['books', 'list', 'lists', 'results', 'contentInfos', 'series', 'search_data', 'episodeList', 'shortPlayEpisodeInfos', 'episodes'];
      for (const key of keys) {
        if (Array.isArray(dc[key])) {
          const list = dc[key] as Record<string, unknown>[];
          if (key === 'search_data' && list.length > 0) {
             const firstItem = list[0] as Record<string, unknown>;
             if (Array.isArray(firstItem.books)) {
                result = firstItem.books as Record<string, unknown>[];
             } else {
                result = list;
             }
          } else {
             result = list;
          }
          break;
        }
      }
    }

    if (result.length === 0) {
      for (const key in root) {
        if (Array.isArray(root[key]) && key !== 'shadedWordSearchResult') {
          result = root[key] as Record<string, unknown>[];
          break;
        }
      }
    }
  } catch (e) {
    if (label) console.error(`[EXTRACT-ERROR] ${label}:`, e);
  }
  
  return result;
}

async function fetchData<T>(endpoint: string): Promise<T | null> {
  const blacklistedParams = ["bookId=", "shortPlayId=", "id=", "videoId="];
  if (blacklistedParams.some(param => endpoint.includes(`${param}&`) || endpoint.endsWith(param))) {
    return null;
  }

  try {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/${endpoint.replace(/^\//, "")}`;
    
    const res = await fetch(url, { 
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 } 
    });
    
    if (!res.ok) {
      console.warn(`[FETCH-WARN] ${res.status} on ${url}`);
      return null;
    }
    return await res.json() as T;
  } catch (err) { 
    console.error(`[FETCH-ERROR] ${endpoint}:`, err);
    return null; 
  }
}

/**
 * HELPER: Patching khusus Netshort agar EPS muncul
 */
const patchNetshortItems = async (items: Record<string, unknown>[]): Promise<DramaItem[]> => {
  return Promise.all(items.map(async (b) => {
    const mapped = mapDramaData(b, "netshort");
    if (mapped.bookId && (mapped.chapterCount === 0 || !mapped.chapterCount)) {
      const epRes = await fetchData<Record<string, unknown>>(`netshort/allepisode?shortPlayId=${mapped.bookId}`);
      if (epRes) {
        const epData = (epRes.data as Record<string, unknown>) || epRes;
        mapped.chapterCount = Number(epData?.totalEpisode || epRes.totalEpisode || 0);
      }
    }
    return mapped;
  }));
};

// --- CORE DATA FETCHERS ---

export async function getAllDracinData(): Promise<DramaSection[]> {
  const [
    dbTrending, dbLatest, dbForyou,
    mlTrending, mlLatest, mlForyou,
    rsTrending, rsForyou,
    nsTheaters, nsForyou,
    frHot, frForyou
  ] = await Promise.all([
    fetchData<unknown>("dramabox/trending"), fetchData<unknown>("dramabox/latest"), fetchData<unknown>("dramabox/foryou"),
    fetchData<unknown>("melolo/trending"), fetchData<unknown>("melolo/latest"), fetchData<unknown>("melolo/foryou"),
    fetchData<unknown>("reelshort/homepage"), fetchData<unknown>("reelshort/foryou"),
    fetchData<unknown>("netshort/theaters"), fetchData<unknown>("netshort/foryou"),
    fetchData<unknown>("flickreels/hotrank"), fetchData<unknown>("flickreels/foryou")
  ]);

  const isValid = (i: DramaItem) => i && i.bookId && String(i.bookId) !== "undefined" && String(i.bookId) !== "";

  const extractMeloloData = (raw: unknown): Record<string, unknown>[] => {
    if (!raw || typeof raw !== 'object') return [];
    const root = raw as Record<string, Record<string, unknown>>;
    const data = root.data;
    if (!data || typeof data !== 'object') return [];
    const cell = data.cell as Record<string, unknown> | undefined;
    const cellData = cell?.cell_data;
    if (Array.isArray(cellData)) {
      return cellData.flatMap((c) => {
        const item = c as Record<string, unknown>;
        return Array.isArray(item.books) ? (item.books as Record<string, unknown>[]) : [];
      });
    }
    return safeExtractList(raw);
  };

  const nsTrendingPatched = await patchNetshortItems(safeExtractList(nsTheaters));
  const nsForyouPatched = await patchNetshortItems(safeExtractList(nsForyou));

  const trendingItems = [
    ...safeExtractList(dbTrending).map(b => mapDramaData(b, "dramabox")),
    ...extractMeloloData(mlTrending).map(b => mapDramaData(b, "melolo")),
    ...safeExtractList(rsTrending).map(b => mapDramaData(b, "reelshort")),
    ...nsTrendingPatched,
    ...safeExtractList(frHot).map(b => mapDramaData(b, "flickreels")),
  ].filter(isValid);

  const latestItems = [
    ...safeExtractList(dbLatest).map(b => mapDramaData(b, "dramabox")),
    ...extractMeloloData(mlLatest).map(b => mapDramaData(b, "melolo")),
  ].filter(isValid);

  const foryouItems = [
    ...safeExtractList(dbForyou).map(b => mapDramaData(b, "dramabox")),
    ...extractMeloloData(mlForyou).map(b => mapDramaData(b, "melolo")),
    ...safeExtractList(frForyou).map(b => mapDramaData(b, "flickreels")),
    ...safeExtractList(rsForyou).map(b => mapDramaData(b, "reelshort")),
    ...nsForyouPatched,
  ].filter(isValid);

  return [
    { title: "Trending Sekarang", items: trendingItems, path: "trending" },
    { title: "Baru Dirilis", items: latestItems, path: "terbaru" },
    { title: "Pilihan Untukmu", items: foryouItems, path: "rekomendasi" },
  ].filter(s => s.items.length > 0);
}

export const getTrendingDrama = async () => {
  const data = await getAllDracinData();
  return data.find(s => s.path === "trending")?.items || [];
};

export const getLatestDrama = async () => {
  const data = await getAllDracinData();
  return data.find(s => s.path === "terbaru")?.items || [];
};

export async function getDramaDubIndo(classify = 'terpopuler', page = 1): Promise<DramaItem[]> {
  const data = await fetchData<unknown>(`dramabox/dubindo?classify=${classify}&page=${page}`);
  return safeExtractList(data).map(b => mapDramaData(b, "dramabox"));
}

export async function getMeloloTrending(): Promise<DramaItem[]> {
  const data = await fetchData<unknown>("melolo/trending");
  return safeExtractList(data).map(b => mapDramaData(b, "melolo"));
}

export async function getMeloloHome(): Promise<DramaItem[]> {
  return getMeloloTrending();
}

export async function getRandomDrama(): Promise<DramaItem | null> {
  const res = await fetchData<unknown>("dramabox/randomdrama");
  const list = safeExtractList(res);
  return list.length > 0 ? mapDramaData(list[0], "dramabox") : null;
}

export async function getPopulerSearch(): Promise<DramaItem[]> {
  const data = await fetchData<unknown>("dramabox/populersearch");
  return safeExtractList(data).map(b => mapDramaData(b, "dramabox"));
}

export async function getMeloloForYou(): Promise<DramaItem[]> {
  try {
    const res = await fetchData<MeloloResponse>("melolo/foryou");
    const books = res?.data?.cell?.books || [];
    return books.map((b: MeloloBook) => mapDramaData(b, "melolo"));
  } catch { return []; }
}

export async function searchDramaReelshort(query: string): Promise<DramaItem[]> {
  const res = await fetchData<unknown>(`reelshort/search?query=${encodeURIComponent(query)}`);
  return safeExtractList(res).map(b => mapDramaData(b, "reelshort"));
}

export async function searchDramaNetshort(query: string): Promise<DramaItem[]> {
  const res = await fetchData<unknown>(`netshort/search?query=${encodeURIComponent(query)}`);
  return patchNetshortItems(safeExtractList(res));
}

export async function searchDramaFlickreels(query: string): Promise<DramaItem[]> {
  const res = await fetchData<unknown>(`flickreels/search?query=${encodeURIComponent(query)}`);
  return safeExtractList(res).map(b => mapDramaData(b, "flickreels"));
}

export async function searchDramaMelolo(query: string): Promise<DramaItem[]> {
  const res = await fetchData<unknown>(`melolo/search?query=${encodeURIComponent(query)}&limit=15&offset=0`);
  return safeExtractList(res).map(b => mapDramaData(b, "melolo"));
}

export async function searchAllPlatforms(query: string): Promise<DramaItem[]> {
  const results = await Promise.allSettled([
    searchDrama(query),
    searchDramaMelolo(query),
    searchDramaReelshort(query),
    searchDramaNetshort(query),
    searchDramaFlickreels(query)
  ]);
  const allItems = results.flatMap(result => result.status === 'fulfilled' ? result.value : []);
  return allItems.filter((v, i, a) => v.bookId && a.findIndex(t => t.bookId === v.bookId) === i);
}

export async function searchDrama(query: string): Promise<DramaItem[]> {
  const res = await fetchData<unknown>(`dramabox/search?query=${encodeURIComponent(query)}`);
  return safeExtractList(res).map(b => mapDramaData(b, "dramabox"));
}

export async function getDramaDetail(platform: string, id: string): Promise<DramaDetail | null> {
  if (!id || id === "undefined" || id === "") return null;
  if (platform === "melolo") return getMeloloDetail(id);
  
  const plat = platform.toLowerCase();
  let info: Record<string, unknown> | null = null;
  let rawEpisodes: Record<string, unknown>[] = [];

  try {
    if (plat === "flickreels") {
      const res = await fetchData<Record<string, unknown>>(`flickreels/detailAndAllEpisode?id=${id}`);
      if (res) {
        info = (res.drama as Record<string, unknown>) || null;
        rawEpisodes = (res.episodes as Record<string, unknown>[]) || [];
      }
    } else if (plat === "netshort") {
      const res = await fetchData<Record<string, unknown>>(`netshort/allepisode?shortPlayId=${id}`);
      if (res) {
        info = res; 
        rawEpisodes = (res.shortPlayEpisodeInfos as Record<string, unknown>[]) || [];
      }
    } else if (plat === "reelshort") {
      const [detailRes, epRes] = await Promise.all([
        fetchData<Record<string, unknown>>(`reelshort/detail?bookId=${id}`),
        fetchData<Record<string, unknown>>(`reelshort/allepisode?bookId=${id}`)
      ]);
      const detailData = (detailRes?.data as Record<string, unknown>) || detailRes || {};
      info = { ...detailData, ...(epRes || {}) }; 
      rawEpisodes = (epRes?.episodes as Record<string, unknown>[]) || [];
    } else {
      const [dRes, eRes] = await Promise.all([
        fetchData<Record<string, unknown>>(`${plat}/detail?bookId=${id}`),
        fetchData<Record<string, unknown>>(`${plat}/allepisode?bookId=${id}`)
      ]);
      if (dRes) info = (dRes.data as Record<string, unknown>) || dRes;
      rawEpisodes = safeExtractList(eRes);
    }

    if (!info && rawEpisodes.length === 0) return null;
    const mappedBase = mapDramaData(info || {}, platform as PlatformType);

    return {
      ...mappedBase,
      bookId: id,
      title: mappedBase.title || String(info?.title || "").toUpperCase(),
      intro: mappedBase.intro || String(info?.introduction || info?.description || "Sinopsis tidak tersedia."),
      chapterCount: rawEpisodes.length > 0 ? rawEpisodes.length : Number(info?.totalEpisodes || 0), 
      chapters: rawEpisodes.map((ep: Record<string, unknown>, idx: number) => {
        let videoUrl = "";
        if (ep.cdnList && Array.isArray(ep.cdnList)) {
            const cdnList = ep.cdnList as Record<string, unknown>[];
            const cdn = cdnList.find(c => c.isDefault === 1) || cdnList[0];
            if (cdn && cdn.videoPathList && Array.isArray(cdn.videoPathList)) {
                const pathList = cdn.videoPathList as Record<string, unknown>[];
                const video = pathList.find(v => v.quality === 720) || pathList[0];
                videoUrl = String(video?.videoPath || "");
            }
        } 
        else if (Array.isArray(ep.videoList)) {
            const list = ep.videoList as Record<string, unknown>[];
            const h264 = list.find(v => String(v.encode).toUpperCase() === "H264");
            videoUrl = String(h264?.url || list[0]?.url || "");
        }
        return {
          chapterId: String(ep.chapterId || ep.episodeId || ep.id || idx),
          title: String(ep.chapterName || ep.title || `Episode ${idx + 1}`),
          url: videoUrl,
          sort: idx + 1,
          isLocked: !!(ep.isCharge === 1 || ep.isLocked || ep.isLock),
          vid: String(ep.chapterId || ep.episodeId || ep.id || "")
        };
      })
    };
  } catch (error) {
    console.error(`[DETAIL-FATAL] ${platform}-${id}:`, error);
    return null;
  }
}

export async function getMeloloDetail(id: string): Promise<DramaDetail | null> {
  const res = await fetchData<Record<string, unknown>>(`melolo/detail?bookId=${id}`);
  if (!res) return null;
  const dataWrapper = (res.data as Record<string, unknown>) || res;
  const v = (dataWrapper.video_data as Record<string, unknown>) || dataWrapper;
  if (!v || typeof v !== 'object') return null;
  const videoList = (v.video_list || []) as Record<string, unknown>[];
  return {
    bookId: String(v.series_id_str || id),
    title: String(v.series_title || "Unknown").toUpperCase(),
    cover: (v.series_cover as string) || (v.vertical_cover as string) || "",
    intro: (v.series_intro as string) || "",
    chapterCount: Number(v.episode_cnt || 0),
    platform: "melolo",
    score: "9.8",
    tag: "DRAMA",
    chapters: videoList.map((cp) => ({
      chapterId: String(cp.vid),
      title: (cp.title as string) || `Episode ${cp.vid_index}`,
      url: "",
      sort: Number(cp.vid_index || 0),
      isLocked: false,
      vid: String(cp.vid)
    }))
  };
}

export async function getVideoStream(vid: string, platform: string = "melolo"): Promise<StreamPayload | null> {
  if (!vid) return null;
  const plat = platform.toLowerCase();
  let endpoint = "";
  switch (plat) {
    case "dramabox": endpoint = `dramabox/allepisode?bookId=${vid}`; break;
    case "reelshort": endpoint = `reelshort/allepisode?bookId=${vid}`; break;
    case "netshort": endpoint = `netshort/allepisode?shortPlayId=${vid}`; break;
    case "flickreels": endpoint = `flickreels/detailAndAllEpisode?id=${vid}`; break;
    case "melolo": endpoint = `melolo/stream?videoId=${vid}`; break;
    default: endpoint = `${plat}/stream?videoId=${vid}`;
  }
  const res = await fetchData<Record<string, unknown>>(endpoint);
  if (!res) return null;
  const data = (res.data || res) as Record<string, unknown>;
  if (plat === "reelshort") {
      if (Array.isArray(data.episodes)) {
          const eps = data.episodes as Record<string, unknown>[];
          const target = eps.find(e => String(e.chapterId) === vid) || eps[0];
          if (target && Array.isArray(target.videoList)) {
              const list = target.videoList as Record<string, unknown>[];
              const h264 = list.find(v => String(v.encode).toUpperCase() === "H264");
              return { videoUrl: String(h264?.url || list[0]?.url || "") } as StreamPayload;
          }
      }
  }
  return data as unknown as StreamPayload;
}

export async function getMassiveForyou(page: number = 1): Promise<DramaItem[]> {
  const tasks: { url: string; platform: PlatformType }[] = [];

  if (page <= 50) {
    tasks.push({ url: `dramabox/foryou?page=${page}`, platform: "dramabox" });
    tasks.push({ url: `reelshort/foryou?page=${page}`, platform: "reelshort" });
    tasks.push({ url: `netshort/foryou?page=${page}`, platform: "netshort" });
  }

  if (page <= 2) {
    tasks.push({ url: `flickreels/foryou?page=${page}`, platform: "flickreels" });
  }

  const meloloOffset = page * 20; 
  if (meloloOffset <= 100) {
    tasks.push({ url: `melolo/foryou?offset=${meloloOffset}`, platform: "melolo" });
  }

  if (tasks.length === 0) return [];

  try {
    const results = await Promise.allSettled(tasks.map(t => fetchData<unknown>(t.url)));
    const allItems: DramaItem[] = [];

    results.forEach((res, i) => {
      const task = tasks[i];
      if (res.status === 'fulfilled' && res.value) {
        if (task.platform === "melolo") {
          const meloloRes = res.value as MeloloResponse;
          const books = meloloRes?.data?.cell?.books || [];
          books.forEach((b: MeloloBook) => allItems.push(mapDramaData(b, "melolo")));
        } else {
          const extracted = safeExtractList(res.value);
          extracted.forEach(b => allItems.push(mapDramaData(b, task.platform)));
        }
      }
    });

    const uniqueItems = allItems
      .filter(item => item && item.bookId && String(item.bookId) !== "undefined")
      .filter((v, i, a) => a.findIndex(t => t.bookId === v.bookId) === i);

    return Promise.all(uniqueItems.map(async (item) => {
      if (item.platform === "netshort" && (!item.chapterCount || item.chapterCount === 0)) {
         const epRes = await fetchData<Record<string, unknown>>(`netshort/allepisode?shortPlayId=${item.bookId}`);
         if (epRes) {
           const epData = (epRes.data as Record<string, unknown>) || epRes;
           item.chapterCount = Number(epData?.totalEpisode || epRes.totalEpisode || 0);
         }
      }
      return item;
    })).then(items => {
      return items.sort(() => Math.random() - 0.5);
    });

  } catch (error) {
    console.error("[MASSIVE-FORYOU-ERROR]:", error);
    return [];
  }
}

export async function getMassiveDubIndo(page: number = 1): Promise<DramaItem[]> {
  const classes = ['terpopuler', 'terbaru'];
  try {
    const fetchTasks = classes.map(classify => 
      fetchData<unknown>(`dramabox/dubindo?classify=${classify}&page=${page}`)
    );
    const results = await Promise.all(fetchTasks);
    const allItems = results.flatMap(res => safeExtractList(res).map(b => mapDramaData(b, "dramabox")));
    return allItems.filter((v, i, a) => v.bookId && a.findIndex(t => t.bookId === v.bookId) === i);
  } catch (error) {
    console.error("Error fetching massive Dub Indo:", error);
    return [];
  }
}