// new Date(10, 0, 1) The year from 0 to 99 will be incremented by 1900 automatically.
export function createDate(y: number, M = 0, d = 1, h = 0, m = 0, s = 0, ms = 0) {
  const date = new Date(y, M, d, h, m, s, ms);
  if (y < 100 && y >= 0) {
    date.setFullYear(y);
  }
  return date;
}

export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * 有效的范围日期
 */
export function isValidRangeDate(dates: unknown): dates is [Date, Date] {
  return (
    Array.isArray(dates) && dates.length === 2 && dates.every(isValidDate) && dates[0] <= dates[1]
  );
}

export function isValidDates(dates: unknown): dates is Date[] {
  return Array.isArray(dates) && dates.every(isValidDate);
}

export function getValidDate(...values: Array<number | string | Date | undefined>): Date {
  if (values[0] !== undefined && values[0] !== null) {
    const date = new Date(values[0]);
    if (isValidDate(date)) {
      return date;
    }
  }
  const rest = values.slice(1);
  if (rest.length) {
    return getValidDate(...rest);
  }
  return new Date();
}

/**
 * 一个日期的开始年，年份开始的第一个第一日
 * xxxx-01-01 00:00:00
 */
export function startOfYear(value: Date) {
  const date = new Date(value);
  date.setMonth(0, 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * 一个日期的开始月，月份开始的第一天
 */
export function startOfMonth(value: Date) {
  const date = new Date(value);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * xxxx-xx-xx 00:00:00
 * 一天的开始
 */
export function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * 获取日历
 */
export function getCalendar({
  firstDayOfWeek,
  year,
  month,
}: {
  firstDayOfWeek: number;
  year: number;
  month: number;
}) {
  const arr = [];
  // change to the last day of the last month
  const calendar = createDate(year, month, 0);
  /**
   * 上个月的最后一天
   */
  const lastDayInLastMonth = calendar.getDate();
  // getDay() 0 is Sunday, 1 is Monday
  const firstDayInLastMonth = lastDayInLastMonth - ((calendar.getDay() + 7 - firstDayOfWeek) % 7);
  for (let i = firstDayInLastMonth; i <= lastDayInLastMonth; i++) {
    arr.push(createDate(year, month, i - lastDayInLastMonth));
  }
  // change to the last day of the current month
  calendar.setMonth(month + 1, 0);
  const lastDayInCurrentMonth = calendar.getDate();
  for (let i = 1; i <= lastDayInCurrentMonth; i++) {
    arr.push(createDate(year, month, i));
  }

  const lastMonthLength = lastDayInLastMonth - firstDayInLastMonth + 1;
  const nextMonthLength = 6 * 7 - lastMonthLength - lastDayInCurrentMonth;
  for (let i = 1; i <= nextMonthLength; i++) {
    arr.push(createDate(year, month, lastDayInCurrentMonth + i));
  }
  return arr;
}

export function setMonth(dirtyDate: Date, dirtyMonth: number | ((v: number) => number)) {
  const date = new Date(dirtyDate);
  const month = typeof dirtyMonth === 'function' ? dirtyMonth(date.getMonth()) : Number(dirtyMonth);
  const year = date.getFullYear();
  const daysInMonth = createDate(year, month + 1, 0).getDate();
  const day = date.getDate();
  date.setMonth(month, Math.min(day, daysInMonth));
  return date;
}

export function setYear(dirtyDate: Date, dirtyYear: number | ((v: number) => number)) {
  const date = new Date(dirtyDate);
  const year = typeof dirtyYear === 'function' ? dirtyYear(date.getFullYear()) : dirtyYear;
  date.setFullYear(year);
  return date;
}

export function diffCalendarMonths(dirtyDateLeft: Date, dirtyDateRight: Date) {
  const dateRight = new Date(dirtyDateRight);
  const dateLeft = new Date(dirtyDateLeft);
  const yearDiff = dateRight.getFullYear() - dateLeft.getFullYear();
  const monthDiff = dateRight.getMonth() - dateLeft.getMonth();
  return yearDiff * 12 + monthDiff;
}

export function assignTime(target: Date, source: Date) {
  const date = new Date(target);
  const time = new Date(source);
  date.setHours(time.getHours(), time.getMinutes(), time.getSeconds());
  return date;
}
