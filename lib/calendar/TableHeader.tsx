import { SetupContext } from 'vue';
import { ButtonIcon } from './ButtonIcon';
import { setMonth, setYear } from '../util/date';
import { usePrefixClass } from '../context';
export interface TableHeaderProps {
  type: 'date' | 'month' | 'year';
  calendar: Date;
  onUpdateCalendar: (value: Date) => void;
}

export function TableHeader(
  { type, calendar, onUpdateCalendar }: TableHeaderProps,
  { slots }: SetupContext
) {
  const prefixClass = usePrefixClass();

  /**
   * 上一月
   */
  const lastMonth = () => {
    onUpdateCalendar(setMonth(calendar, (v) => v - 1));
  };
  /**
   * 下一月
   */
  const nextMonth = () => {
    onUpdateCalendar(setMonth(calendar, (v) => v + 1));
  };
  /**
   * 上一年
   */
  const lastYear = () => {
    onUpdateCalendar(setYear(calendar, (v) => v - 1));
  };
  /**
   * 下一年
   */
  const nextYear = () => {
    onUpdateCalendar(setYear(calendar, (v) => v + 1));
  };

  /**
   * 过去十年
   */
  const lastDecade = () => {
    onUpdateCalendar(setYear(calendar, (v) => v - 10));
  };

  /**
   * 下一个十年
   */
  const nextDecade = () => {
    onUpdateCalendar(setYear(calendar, (v) => v + 10));
  };

  return (
    <div class={`${prefixClass}-calendar-header`}>
      <ButtonIcon
        value="double-left"
        onClick={type === 'year' ? lastDecade : lastYear}
      ></ButtonIcon>
      {type === 'date' && <ButtonIcon value="left" onClick={lastMonth}></ButtonIcon>}
      <ButtonIcon
        value="double-right"
        onClick={type === 'year' ? nextDecade : nextYear}
      ></ButtonIcon>
      {type === 'date' && <ButtonIcon value="right" onClick={nextMonth}></ButtonIcon>}
      <span class={`${prefixClass}-calendar-header-label`}>{slots.default?.()}</span>
    </div>
  );
}
