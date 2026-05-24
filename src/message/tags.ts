export type Lang = 'ko' | 'en' | 'th';

const BASE: Record<Lang, string> = {
  ko: '#방콕러닝 #BangkokRunning',
  en: '#RunBangkok #BangkokRunning',
  th: '#วิ่งกรุงเทพ #BangkokRunning',
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
