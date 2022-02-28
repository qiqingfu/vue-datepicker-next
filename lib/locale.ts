import enUS from './locale/en';
import { Locale } from './type';

let defaultLocale = 'en';
const locales: Record<string, Locale> = {};
locales[defaultLocale] = enUS;

export function locale(name?: string, object?: Locale | null, isLocal = false): Locale {
  if (typeof name !== 'string') return locales[defaultLocale];
  let l = defaultLocale;
  if (locales[name]) {
    l = name;
  }
  if (object) {
    locales[name] = object;
    l = name;
  }
  if (!isLocal) {
    defaultLocale = l;
  }
  return locales[name] || locales[defaultLocale];
}

/**
 * get locale object
 * 获取本地语言对象
 * @param {string} name lang
 */
export function getLocale(name?: string) {
  return locale(name, undefined, true);
}
