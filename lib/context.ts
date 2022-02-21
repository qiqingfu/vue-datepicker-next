import { inject, computed, provide, Ref, shallowRef } from 'vue';
import { getWeek } from 'date-format-parse';
import { Locale } from './type';
import { getLocale } from './locale';
import { isPlainObject, mergeDeep } from './util/base';
import { DeepPartial } from 'utility-types';

const localeContextKey = 'datepicker_locale';
const prefixClassKey = 'datepicker_prefixClass';
const getWeekKey = 'datepicker_getWeek';

export function useLocale() {
  return inject<Ref<Locale>>(localeContextKey, shallowRef(getLocale()));
}
export function provideLocale(lang: Ref<string | DeepPartial<Locale> | undefined>) {
  const locale = computed(() => {
    if (isPlainObject(lang.value)) {
      return mergeDeep(getLocale(), lang.value);
    }
    return getLocale(lang.value);
  });

  provide(localeContextKey, locale);

  return locale;
}

/**
 * 这里将 provide 和 inject 封装在同一个模块中
 * 好处是，可以共用同一个 prefixClassKey 值，无须导出
 */
export function providePrefixClass(value?: string) {
  provide(prefixClassKey, value);
}
export function usePrefixClass() {
  return inject(prefixClassKey, 'mx');
}

/**
 * 在父组件调用 provideGetWeek
 * 提供格式化程序
 */
export function provideGetWeek(value?: typeof getWeek) {
  provide(getWeekKey, value);
}
/**
 * 在任何子组件都通过 useGetWeek 获取，更便捷的值内层传递
 * 使用格式化程序
 */
export function useGetWeek() {
  return inject(getWeekKey, getWeek);
}
