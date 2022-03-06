import { usePrefixClass } from '../context';
import { chunk, last } from '../util/base';
import { createDate } from '../util/date';
import { TableHeader, TableHeaderProps } from './TableHeader';
export interface TableYearProps extends Omit<TableHeaderProps, 'type'> {
  getCellClasses?: (v: Date) => string[] | string;
  getYearPanel?: (v: Date) => number[][];
  onSelect: (v: Date) => void;
}

const getDefaultYears = (calendar: Date) => {
  const firstYear = Math.floor(calendar.getFullYear() / 10) * 10;
  const years = [];
  for (let i = 0; i < 10; i++) {
    years.push(firstYear + i);
  }
  return chunk(years, 2);
};

export function TableYear({
  calendar,
  getCellClasses = () => [],
  getYearPanel = getDefaultYears,
  onSelect,
  onUpdateCalendar,
}: TableYearProps) {
  const prefixClass = usePrefixClass();

  const getDate = (year: number) => {
    // createDate(year, 0) 选择年之后，月份初始化为1月
    return createDate(year, 0);
  };

  const handleClick = (evt: MouseEvent) => {
    const target = evt.currentTarget as HTMLElement;
    const year = target.getAttribute('data-year')!;
    onSelect(getDate(parseInt(year, 10)));
  };

  /**
   * 假如当前为 2022 年，算出 2020 - 2030 十年
   * 分为两组
   */
  const years = getYearPanel(new Date(calendar));
  const firstYear = years[0][0];
  const lastYear = last(last(years));

  return (
    <div class={`${prefixClass}-calendar ${prefixClass}-calendar-panel-year`}>
      <TableHeader type="year" calendar={calendar} onUpdateCalendar={onUpdateCalendar}>
        <span>{firstYear}</span>
        <span class={`${prefixClass}-calendar-decade-separator`}></span>
        <span>{lastYear}</span>
      </TableHeader>
      <div class={`${prefixClass}-calendar-content`}>
        <table class={`${prefixClass}-table ${prefixClass}-table-year`}>
          {years.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  class={['cell', getCellClasses(getDate(cell))]}
                  data-year={cell}
                  onClick={handleClick}
                >
                  <div>{cell}</div>
                </td>
              ))}
            </tr>
          ))}
        </table>
      </div>
    </div>
  );
}
