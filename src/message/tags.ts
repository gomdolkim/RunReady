export type Lang = 'ko' | 'en' | 'th';

const BASE: Record<Lang, string> = {
  ko: '#방콕러닝 #BangkokRunning',
  en: '#RunBangkok #BangkokRunning',
  th: '#วิ่งกรุงเทพ #BangkokRunning',
};

/** Base hashtags for the "place of the day" travel post (per language). */
const PLACE_BASE: Record<Lang, string> = {
  ko: '#방콕여행 #방콕가볼만한곳',
  en: '#Bangkok #BangkokTravel',
  th: '#เที่ยวกรุงเทพ #กรุงเทพ',
};

/**
 * Topic-tag line for discovery. Tags are appended in code AFTER translation, so
 * the translator never has to preserve them (avoids the "no Korean left" check
 * tripping on Korean hashtags). The spot tag is an English token shared by all
 * languages.
 */
export function tagLine(lang: Lang, spotTag?: string): string {
  return spotTag ? `${BASE[lang]} #${spotTag}` : BASE[lang];
}

/** Append the tag line to a post body after a blank line. */
export function appendTags(body: string, lang: Lang, spotTag?: string): string {
  return `${body}\n\n${tagLine(lang, spotTag)}`;
}

/** Travel tag line for the place post; the place tag is a shared English token. */
export function placeTagLine(lang: Lang, placeTag?: string): string {
  return placeTag ? `${PLACE_BASE[lang]} #${placeTag}` : PLACE_BASE[lang];
}

/** Append the travel tag line to a place post body after a blank line. */
export function appendPlaceTags(body: string, lang: Lang, placeTag?: string): string {
  return `${body}\n\n${placeTagLine(lang, placeTag)}`;
}
