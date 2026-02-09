export type PlatformType = 'melolo' | 'dramabox' | 'reelshort' | 'netshort' | 'flickreels' | 'freereels' | 'moviebox' | string;

export interface DramaItem {
  bookId: string;
  title: string;
  cover: string;
  horizontalCover?: string;
  intro?: string;
  score?: string;
  tag?: string;
  playCount?: string;
  chapterCount?: number;
  platform: PlatformType;
  genre?: string;
  allTags?: string[];
}

export interface DramaSection {
  title: string;
  items: DramaItem[];
  path: string;
}

export interface DramaDetail extends DramaItem {
  chapters: DramaChapter[];
}

export interface MeloloBook {
  book_id?: string;
  title?: string;
  cover?: string;
  book_cover?: string;
  intro?: string;
  score?: string | number;
  chapter_count?: number;
  [key: string]: unknown;
}

export interface MeloloResponse {
  data?: {
    cell?: {
      books?: MeloloBook[];
    };
  };
}

export interface DramaChapter {
  chapterId: string;
  title: string;
  url: string;
  sort: number;
  isLocked: boolean;
  vid?: string;
}

export interface FlickReelsHotRank {
  name: string;
  rank_type: number;
  data: RawDramaData[];
}

export interface RawDramaData {
  playlet_id?: string | number;
  playlet_tag_name?: string[];
  upload_num?: string | number;
  introduce?: string;
  tag_list?: Array<{ tag_name: string }>;
  drama?: RawDramaData; 
  list?: RawDramaData[]; 
  key?: string; 
  bookId?: string;
  book_id?: string | number;
  short_play_id?: string | number;
  short_play_name?: string;
  short_play_cover?: string;
  bookName?: string;
  book_name?: string;
  series_id?: string;
  series_title?: string;
  series_cover?: string;
  title?: string;
  desc?: string;
  coverWap?: string;
  cover?: string;
  thumb_url?: string;
  cover_url?: string;
  introduction?: string;
  intro?: string;
  abstract?: string;
  episode_count?: number;
  chapterCount?: number;
  serial_count?: string | number;
  last_chapter_index?: string | number;
  score?: string;
  tags?: string[];
  categoryName?: string;
  category_name?: string;
  stat_infos?: string[];
  rankVo?: { hotCode: string };
  allAllNum?: number;
  horizontalCover?: string;
  cover_stat_infos?: Array<{ stat_value: string }>;
  video_list?: RawEpisodeData[];
  episodes?: RawEpisodeData[];
  subjectId?: string; 
}

export interface RawEpisodeData {
  id?: string;
  chapterId?: string;
  episodeId?: string;
  item_id?: string;
  chapterName?: string;
  name?: string;
  title?: string;
  chapterIndex?: number;
  chapter_index?: string | number;
  vid_index?: number;
  index?: number;
  isCharge?: number;
  is_lock?: number;
  isLocked?: boolean;
  vid?: string;
  main_url?: string;
  video_url?: string;
  videoUrl?: string; 
  m3u8_url?: string;
  external_audio_h264_m3u8?: string;
  raw?: { videoUrl?: string };
  playVoucher?: string;
  videoList?: Array<{
    url: string;
    quality: number;
    encode: string;
    bitrate?: string;
  }>;
  cdnList?: Array<{
    url?: string;
    isDefault?: number;
    videoPathList?: Array<{ 
      quality: number; 
      videoPath: string; 
      isDefault: number 
    }>;
  }>;
}

export interface MeloloFlexibleResponse {
  data?: {
    cell?: { cell_data?: { books?: RawDramaData[] }[] };
    cell_data?: { books?: RawDramaData[] }[];
    books?: RawDramaData[];
  };
  cell_data?: { books?: RawDramaData[] }[];
  books?: RawDramaData[];
}

export interface SansekaiMeloloDetail {
  code: number;
  data?: {
    video_data?: {
      series_id_str: string;
      series_title: string;
      series_cover: string;
      series_intro: string;
      episode_cnt: number;
      video_list: Array<{ vid: string; vid_index: number; title: string }>;
    };
  };
}

export interface ExtractRoot {
  data?: {
    cell?: {
      cell_data?: Array<{
        books?: Record<string, unknown>[];
        list?: Record<string, unknown>[];
      }>;
    };
    books?: Record<string, unknown>[];
    list?: Record<string, unknown>[];
    lists?: Record<string, unknown>[];
    results?: Record<string, unknown>[];
    contentInfos?: Record<string, unknown>[];
  };
  books?: Record<string, unknown>[];
  [key: string]: unknown;
}

export interface VideoPathItem {
  quality?: number;
  videoPath?: string;
  isDefault?: number;
}

export interface CdnItem {
  isDefault?: number;
  url?: string;
  videoPath?: string;
  videoPathList?: VideoPathItem[];
}