import { format } from 'date-format-parse';
import { usePrefixClass, useLocale, useGetWeek } from '../context';
import { PanelType } from '../type';
import { chunk } from '../util/base';
import { getCalendar } from '../util/date';
import { TableHeader, TableHeaderProps } from './TableHeader';

export interface TableDateProps extends Omit<TableHeaderProps, 'type'> {
  showWeekNumber?: boolean;
  isWeekMode: boolean; // 是否显示星期数字
  titleFormat: string;
  getWeekActive: (value: Date[]) => boolean;
  getCellClasses: (value: Date) => string[] | string;
  onSelect: (value: Date) => void;
  onUpdatePanel: (value: PanelType) => void;
  onDateMouseEnter?: (value: Date) => void;
  onDateMouseLeave?: (value: Date) => void;
}

export function TableDate({
  calendar,
  isWeekMode,
  showWeekNumber,
  titleFormat,
  getWeekActive,
  getCellClasses,
  onSelect,
  onUpdatePanel,
  onUpdateCalendar,
  onDateMouseEnter,
  onDateMouseLeave,
}: TableDateProps) {
  const prefixClass = usePrefixClass();
  /**
   * useGetWeeik 获取的是在 Picker 注入的函数
   * props.formatter?.getWeek || getWeek
   * getWeek 从 date-format-parse 导出的函数
   *
   * 获取今天已经过去了多少个周
   */
  const getWeekNumber = useGetWeek();
  const locale = useLocale().value;

  /**
   * 语言配置信息，默认为英文
   */
  const { yearFormat, monthBeforeYear, monthFormat = 'MMM', formatLocale } = locale;

  /**
   * 一周的第一天
   */
  const firstDayOfWeek = formatLocale.firstDayOfWeek || 0;
  let days = locale.days || formatLocale.weekdaysMin;
  /**
   * 根据设置的 firstDayOfWeek，计算出一周从星期几开始
   */
  days = days.concat(days).slice(firstDayOfWeek, firstDayOfWeek + 7);

  const year = calendar.getFullYear();
  const month = calendar.getMonth();

  /**
   * getCalendar 根据年、月和周的第几天，生成当月的日历数据
   * 通过 chunk 将日历数组拆分为 6 组
   */
  const dates = chunk(getCalendar({ firstDayOfWeek, year, month }), 7);

  /**
   * 格式化日期
   */
  const formatDate = (date: Date, fmt: string) => {
    return format(date, fmt, { locale: locale.formatLocale });
  };

  /**
   * 切换年或月
   */
  const handlePanelChange = (panel: 'year' | 'month') => {
    onUpdatePanel(panel);
  };

  const getCellDate = (el: HTMLElement) => {
    const index = el.getAttribute('data-index')!;
    /**
     * 获取 row 行，col 列
     */
    const [row, col] = index.split(',').map((v) => parseInt(v, 10));
    const value = dates[row][col];
    return new Date(value);
  };

  /**
   * 当日历被点击时
   */
  const handleCellClick = (evt: MouseEvent) => {
    onSelect(getCellDate(evt.currentTarget as HTMLElement));
  };

  const handleMouseEnter = (evt: MouseEvent) => {
    /**
     * 传递给 TableDate 的props.onDateMouseEnter 函数
     */
    if (onDateMouseEnter) {
      onDateMouseEnter(getCellDate(evt.currentTarget as HTMLElement));
    }
  };

  const handleMouseLeave = (evt: MouseEvent) => {
    if (onDateMouseLeave) {
      onDateMouseLeave(getCellDate(evt.currentTarget as HTMLElement));
    }
  };

  const yearLabel = (
    <button
      type="button"
      class={`${prefixClass}-btn ${prefixClass}-btn-text ${prefixClass}-btn-current-year`}
      onClick={() => handlePanelChange('year')}
    >
      {formatDate(calendar, yearFormat)}
    </button>
  );

  const monthLabel = (
    <button
      type="button"
      class={`${prefixClass}-btn ${prefixClass}-btn-text ${prefixClass}-btn-current-month`}
      onClick={() => handlePanelChange('month')}
    >
      {formatDate(calendar, monthFormat)}
    </button>
  );

  showWeekNumber = typeof showWeekNumber === 'boolean' ? showWeekNumber : isWeekMode;

  return (
    <div
      class={[
        `${prefixClass}-calendar ${prefixClass}-calendar-panel-date`,
        { [`${prefixClass}-calendar-week-mode`]: isWeekMode },
      ]}
    >
      {/* 日历头部 */}
      <TableHeader type="date" calendar={calendar} onUpdateCalendar={onUpdateCalendar}>
        {/* 应用默认插槽*/}
        {monthBeforeYear ? [monthLabel, yearLabel] : [yearLabel, monthLabel]}
      </TableHeader>
      <div class={`${prefixClass}-calendar-content`}>
        <table class={`${prefixClass}-table ${prefixClass}-table-date`}>
          <thead>
            <tr>
              {showWeekNumber && <th class={`${prefixClass}-week-number-header`}></th>}
              {days.map((day) => (
                <th key={day}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dates.map((row, i) => (
              <tr
                key={i}
                class={[
                  `${prefixClass}-date-row`,
                  { [`${prefixClass}-active-week`]: getWeekActive(row) },
                ]}
              >
                {/* 显示周，当前月份和日属于当前年的第几周 */}
                {showWeekNumber && (
                  <td
                    class={`${prefixClass}-week-number`}
                    data-index={`${i},0`}
                    onClick={handleCellClick}
                  >
                    <div>{getWeekNumber(row[0])}</div>
                  </td>
                )}
                {row.map((cell, j) => (
                  <td
                    key={j}
                    class={['cell', getCellClasses(cell)]}
                    title={formatDate(cell, titleFormat)}
                    data-index={`${i},${j}`}
                    onClick={handleCellClick}
                    onMouseenter={handleMouseEnter}
                    onMouseleave={handleMouseLeave}
                  >
                    <div>{cell.getDate()}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
