import { DramaItem, PlatformType, RawEpisodeData } from "./types";

export const getAutoGenre = (title: string, intro: string): string => {
  const content = `${title} ${intro}`.toLowerCase();
  if (/ceo|bos|presiden|miliarder/.test(content)) return "CEO";
  if (/nikah|istri|suami|cerai|mertua/.test(content)) return "Pernikahan";
  if (/cinta|love|romansa|pasangan/.test(content)) return "Romansa";
  if (/balas|dendam|revenge|penghianatan/.test(content)) return "Pembalasan";
  if (/reinkarnasi|hidup kembali/.test(content)) return "Reinkarnasi";
  return "Drama";
};

export function mapDramaData(rawItem: Record<string, unknown>, platformOverride?: PlatformType): DramaItem {
  if (!rawItem) return {} as DramaItem;
  const item = (rawItem.drama ? rawItem.drama : rawItem) as Record<string, unknown>;

  const isML = !!(item.book_id || item.series_id);
  const isFR = !!(item.playlet_id || item.playlet_name);
  const isNS = !!(item.short_play_id || item.shortPlayId);
  const isRS = !!(item.book_title || item.totalEpisodes || (item.bookId && !isML && !isNS && !isFR));
  const isDB = !!(item.chapterId || item.chapterName || item.cdnList || item.bookName);

  const detectedPlatform: PlatformType = platformOverride || 
    (isML ? 'melolo' : isNS ? 'netshort' : isFR ? 'flickreels' : isRS ? 'reelshort' : isDB ? 'dramabox' : 'dramabox');

  const rawTitle = (item.book_title || item.title || item.bookName || item.shortPlayName || item.short_play_name || item.playlet_name || item.series_title || item.book_name || item.name || "Untitled");
  const title = String(rawTitle).replace(/<\/?[^>]+(>|$)/g, "").trim();

  const intro = String(item.special_desc || item.description || item.introduction || item.introduce || item.shotIntroduce || item.abstract || item.desc || "Sinopsis tidak tersedia.").trim();

  let allTags: string[] = [];
  if (Array.isArray(item.playlet_tag_name)) allTags = item.playlet_tag_name as string[];
  else if (Array.isArray(item.tag_name)) allTags = item.tag_name as string[];
  else if (Array.isArray(item.labelArray)) allTags = item.labelArray as string[];
  else if (Array.isArray(item.tag_list)) {
      const tags = item.tag_list as Record<string, unknown>[];
      allTags = tags.map(t => String(t.tag_name || t.name || ""));
  }

  let finalGenre = allTags[0] || getAutoGenre(title, intro);
  if (finalGenre.length > 15) finalGenre = finalGenre.substring(0, 12) + "...";

  let rawCover = String(item.book_pic || item.cover || item.shortPlayCover || item.short_play_cover || item.coverWap || item.playlet_cover || item.series_cover || item.thumb_url || item.cover_url || item.chapterImg || "");

  if (rawCover && !rawCover.startsWith('http')) {
    const baseUrls: Record<string, string> = {
      melolo: "https://image.melolo.com",
      dramabox: "https://cdn.dramabox.com",
      reelshort: "https://v-mps.crazymaplestudios.com",
      netshort: "https://v-image.netshort.tv",
      flickreels: "https://zshipubcdn.farsunpteltd.com"
    };
    const base = baseUrls[detectedPlatform] || "https://cdn.dramabox.com";
    rawCover = `${base}${rawCover.startsWith('/') ? rawCover : `/${rawCover}`}`;
  }

  return {
    bookId: String(item.book_id || item.playlet_id || item.short_play_id || item.shortPlayId || item.series_id || item.bookId || item.chapterId || item.id || ""),
    title: title.toUpperCase(),
    cover: rawCover,
    horizontalCover: String(item.coverWap || item.horizontalCover || item.playlet_horizontal_cover || ""),
    intro,
    score: String(item.score || item.heatScoreShow || (detectedPlatform === 'melolo' ? "9.8" : "9.5")),
    tag: finalGenre.toUpperCase(),
    playCount: String(item.playCount || item.heatScoreShow || item.hot_num || "1.2M"),
    chapterCount: Number(item.totalEpisodes || item.chapter_count || item.chapterCount || item.serial_count || item.episode_count || item.upload_num || item.totalEpisode || 0),
    platform: detectedPlatform,
    genre: finalGenre,
    allTags: allTags.filter(t => t !== "").length > 0 ? allTags : [finalGenre]
  };
}

export function extractVideoUrl(cdnList: RawEpisodeData['cdnList']): string {
  if (!cdnList || !Array.isArray(cdnList) || cdnList.length === 0) return "";

  const defaultCdn = (cdnList.find((c) => (c as Record<string, unknown>).isDefault === 1) || cdnList[0]) as Record<string, unknown>;

  if (defaultCdn.videoPathList && Array.isArray(defaultCdn.videoPathList) && defaultCdn.videoPathList.length > 0) {
    const pathList = defaultCdn.videoPathList as Record<string, unknown>[];
    const video = pathList.find((v) => v.quality === 720) || 
                  pathList.find((v) => v.isDefault === 1) || 
                  pathList[0];
    return String(video?.videoPath || "");
  }

  return String(defaultCdn.url || "");
}