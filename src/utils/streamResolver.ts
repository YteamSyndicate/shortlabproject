import { extractVideoUrl } from "@/lib/mapper";

// --- INTERFACES ---

export interface VideoSource {
  main_url: string;
  definition?: string;
}

export interface MeloloVideoModel {
  video_list?: {
    video_1?: VideoSource;
    video_4?: VideoSource;
    video_5?: VideoSource;
  };
}

export interface VideoPathItem {
  quality: number;
  videoPath: string;
  isDefault: number;
}

export interface CdnItem {
  isDefault: number;
  url?: string;
  videoPathList?: VideoPathItem[];
}

export interface BaseEpisode {
  episodeId?: string | number;
  id?: string | number;
  chapterId?: string | number;
  vid?: string | number;
  main_url?: string;
  cdnList?: CdnItem[];
  videoList?: Array<{
    url: string;
    quality: number;
    encode: string;
  }>;
  playVoucher?: string;
  videoUrl?: string;
  playlet_info?: {
    video_url?: string;
  };
  raw?: {
    videoUrl?: string;
  };
}

export interface StreamPayload extends BaseEpisode {
  video_model?: string | MeloloVideoModel;
  data?: BaseEpisode | BaseEpisode[] | null;
}

export interface StreamResult {
  url: string;
  type: 'hls' | 'mp4';
  platform: string;
}

// --- HELPERS ---

const decodeMelolo = (str: string): string => {
  try {
    if (typeof window === "undefined") {
      return Buffer.from(str, 'base64').toString('utf-8');
    }
    return atob(str);
  } catch {
    return str;
  }
};

/**
 * resolveStream
 */
export const resolveStream = (data: StreamPayload | null, targetVid?: string | number): StreamResult | null => {
  if (!data) return null;

  let coreData: BaseEpisode | null = null;

  if (Array.isArray(data)) {
    const dataAsArray = data as BaseEpisode[];
    if (!targetVid) {
      coreData = dataAsArray[0];
    } else {
      coreData = dataAsArray.find((item) => 
        String(item.chapterId || item.episodeId || item.id || item.vid) === String(targetVid)
      ) || dataAsArray[0];
    }
  } 
  else if (data.data) {
    if (Array.isArray(data.data)) {
      coreData = data.data.find((item) => 
        String(item.episodeId || item.id || item.chapterId || item.vid) === String(targetVid)
      ) || data.data[0];
    } else {
      coreData = data.data;
    }
  } 
  else {
    coreData = data;
  }

  if (!coreData) return null;

  // A. DRAMABOX
  if (coreData.cdnList && coreData.cdnList.length > 0) {
    const selectedCdn = coreData.cdnList.find(c => c.isDefault === 1) || coreData.cdnList[0];
    
    if (selectedCdn.videoPathList && selectedCdn.videoPathList.length > 0) {
      const video = selectedCdn.videoPathList.find(v => v.quality === 720) || 
                    selectedCdn.videoPathList.find(v => v.isDefault === 1) ||
                    selectedCdn.videoPathList[0];
      
      if (video?.videoPath) {
        return { url: video.videoPath, type: 'mp4', platform: 'Dramabox' };
      }
    }

    const mappedUrl = extractVideoUrl(coreData.cdnList);
    if (mappedUrl) return { url: mappedUrl, type: 'mp4', platform: 'Dramabox' };
  }
  
  // B. REELSHORT
  if (coreData.videoList && coreData.videoList.length > 0) {
    const video = coreData.videoList.find((v) => v.quality === 720) || coreData.videoList[0];
    if (video?.url) {
      return { url: video.url, type: 'hls', platform: 'Reelshort' };
    }
  }

  // C. NETSHORT
  if (coreData.playVoucher) {
    return { url: coreData.playVoucher, type: 'mp4', platform: 'Netshort' };
  }

  // D. FLICKREELS
  const flickUrl = coreData.videoUrl || coreData.playlet_info?.video_url || coreData.raw?.videoUrl;
  if (flickUrl) {
    return { url: flickUrl, type: 'mp4', platform: 'Flickreels' };
  }

  // E. MELOLO
  let meloloModel = data.video_model;

  if (!meloloModel && data.data && !Array.isArray(data.data)) {
    const dataAsEpisode = data.data as StreamPayload;
    meloloModel = dataAsEpisode.video_model;
  }

  if (meloloModel) {
    try {
      const model: MeloloVideoModel = typeof meloloModel === 'string' 
        ? (JSON.parse(meloloModel) as MeloloVideoModel)
        : (meloloModel as MeloloVideoModel);
      
      const vList = model.video_list;
      const bestVideo = vList?.video_5 || vList?.video_4 || vList?.video_1;
      
      const decodedUrl = bestVideo?.main_url ? decodeMelolo(bestVideo.main_url) : "";
      const finalUrl = decodedUrl || coreData.main_url || data.main_url || "";

      if (finalUrl) {
        return { url: finalUrl, type: 'mp4', platform: 'Melolo' };
      }
    } catch (e) {
      console.error("Gagal parse Melolo:", e);
    }
  }

  // F. FALLBACK (main_url)
  const fallbackUrl = coreData.main_url || data.main_url;
  if (fallbackUrl) {
    return {
      url: fallbackUrl,
      type: 'mp4',
      platform: 'Auto/Melolo'
    };
  }

  return null;
};