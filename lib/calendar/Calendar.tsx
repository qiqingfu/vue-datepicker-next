import { computed, ref, watchEffect } from 'vue';
import {
  getValidDate,
  isValidDate,
  setMonth,
  setYear,
  startOfDay,
  startOfMonth,
  startOfYear,
} from '../util/date';
import { TableDate } from './TableDate';
import { TableMonth } from './TableMonth';
import { TableYear } from './TableYear';
import { PanelType, PickerType } from '../type';
import { defineVueComponent, keys, withDefault } from '../vueUtil';

export interface CalendarProps {
  type?: PickerType;
  value?: Date | Date[];
  defaultValue?: Date;
  defaultPanel?: PickerType;
  disabledDate?: (value: Date, innerValue?: Date[]) => boolean;
  getClasses?: (value: Date, innerValue: Date[], classes: string) => string[] | string;
  calendar?: Date;
  multiple?: boolean;
  partialUpdate?: boolean; // update date when select year or month
  showWeekNumber?: boolean;
  titleFormat?: string;
  getYearPanel?: () => number[][];
  onDateMouseEnter?: (value: Date) => void;
  onDateMouseLeave?: (value: Date) => void;
  onCalendarChange?: (value: Date) => void;
  onPanelChange?: (value: PanelType, oldValue: PanelType) => void;
  onPick?: (value: Date) => void;
  ['onUpdate:value']?: (v: any, type: string) => void;
}

/**
 * type：date
 * range：false
 */
function Calendar(originalProps: CalendarProps) {
  const props = withDefault(originalProps, {
    defaultValue: startOfDay(new Date()),
    type: 'date' as PickerType,
    disabledDate: () => false,
    getClasses: () => [],
    titleFormat: 'YYYY-MM-DD',
  });

  /**
   * 计算 props.value 和 props.type
   * 计算 年、月、日的开始日期
   */
  const innerValue = computed(() => {
    const value = Array.isArray(props.value) ? props.value : [props.value];
    return value.filter(isValidDate).map((v) => {
      if (props.type === 'year') return startOfYear(v);
      if (props.type === 'month') return startOfMonth(v);
      return startOfDay(v);
    });
  });

  /**
   * 内部日程表
   */
  const innerCalendar = ref<Date>(new Date());
  watchEffect(() => {
    let calendarDate = props.calendar;
    if (!isValidDate(calendarDate)) {
      const { length } = innerValue.value;
      calendarDate = getValidDate(length > 0 ? innerValue.value[length - 1] : props.defaultValue);
    }
    innerCalendar.value = startOfMonth(calendarDate);
  });

  const handleCalendarChange = (calendar: Date) => {
    innerCalendar.value = calendar;
    props.onCalendarChange?.(calendar);
  };

  const panel = ref<PanelType>('date');
  watchEffect(() => {
    const panels = ['date', 'month', 'year'];
    const index = Math.max(panels.indexOf(props.type), panels.indexOf(props.defaultPanel!));
    panel.value = index !== -1 ? (panels[index] as PanelType) : 'date';
  });

  /**
   * 切换面板
   */
  const handelPanelChange = (value: PanelType) => {
    const oldPanel = panel.value;
    panel.value = value;
    props.onPanelChange?.(value, oldPanel);
  };

  /**
   * 禁止选择的日期
   */
  const isDisabled = (date: Date) => {
    /**
     * 通过 new Date(date) 可以复制一份日期
     */
    return props.disabledDate(new Date(date), innerValue.value);
  };

  const emitDate = (date: Date, type: string) => {
    /**
     * 如果年被禁用了，点击无效
     */
    if (!isDisabled(date)) {
      props.onPick?.(date);
      if (props.multiple === true) {
        const nextDates = innerValue.value.filter((v) => v.getTime() !== date.getTime());
        if (nextDates.length === innerValue.value.length) {
          nextDates.push(date);
        }
        props['onUpdate:value']?.(nextDates, type);
      } else {
        props['onUpdate:value']?.(date, type);
      }
    }
  };

  const handleSelectDate = (date: Date) => {
    emitDate(date, props.type === 'week' ? 'week' : 'date');
  };

  /**
   * 面板 panel 为 year
   * 选中某一样触发的事件函数
   */
  const handleSelectYear = (date: Date) => {
    if (props.type === 'year') {
      emitDate(date, 'year');
    } else {
      // 如果为面板切换，选择年之后切换为 month 月面板
      handleCalendarChange(date);
      handelPanelChange('month');
      /**
       * 部分更新，这里只是单独使用年面板的时候
       */
      if (props.partialUpdate && innerValue.value.length === 1) {
        const value = setYear(innerValue.value[0], date.getFullYear());
        emitDate(value, 'year');
      }
    }
  };

  const handleSelectMonth = (date: Date) => {
    if (props.type === 'month') {
      emitDate(date, 'month');
    } else {
      /**
       * 月份更新，将 Y-M-xxxx 最新值同步给内部日历
       */
      handleCalendarChange(date);
      /**
       * 切换到选择日面板
       */
      handelPanelChange('date');
      if (props.partialUpdate && innerValue.value.length === 1) {
        const value = setMonth(setYear(innerValue.value[0], date.getFullYear()), date.getMonth());
        emitDate(value, 'month');
      }
    }
  };

  /**
   * 根据当前 cell 日期，计算出它的 class
   */
  const getCellClasses = (cellDate: Date, classes: string[] = []) => {
    /**
     * 内部调用外部的回调函数，将必要的值传递出去，根据回调函数的返回值
     * 决定当前日期是否禁用
     */
    if (isDisabled(cellDate)) {
      classes.push('disabled');
    } else if (innerValue.value.some((v) => v.getTime() === cellDate.getTime())) {
      classes.push('active');
    }
    return classes.concat(props.getClasses(cellDate, innerValue.value, classes.join(' ')));
  };

  const getDateClasses = (cellDate: Date) => {
    /**
     * 是否为当前月
     */
    const notCurrentMonth = cellDate.getMonth() !== innerCalendar.value.getMonth();
    const classes = [];
    if (cellDate.getTime() === new Date().setHours(0, 0, 0, 0)) {
      classes.push('today');
    }
    /**
     * 非当前月的日期，添加 not-current-month 类
     */
    if (notCurrentMonth) {
      classes.push('not-current-month');
    }
    return getCellClasses(cellDate, classes);
  };

  const getMonthClasses = (cellDate: Date) => {
    if (props.type !== 'month') {
      return innerCalendar.value.getMonth() === cellDate.getMonth() ? 'active' : '';
    }
    return getCellClasses(cellDate);
  };

  /**
   * TableYear，当前年的样式
   */
  const getYearClasses = (cellDate: Date) => {
    /**
     * 如果日期选择类型不为 year，说明是从其他类型切换到 year 面板的
     * innterCalendar的年与 TableYear 每一个 cell 相等，则添加 active 选中样式
     */
    if (props.type !== 'year') {
      return innerCalendar.value.getFullYear() === cellDate.getFullYear() ? 'active' : '';
    }
    return getCellClasses(cellDate);
  };

  const getWeekActive = (row: Date[]) => {
    if (props.type !== 'week') return false;
    const start = row[0].getTime();
    const end = row[6].getTime();
    return innerValue.value.some((v) => {
      const time = v.getTime();
      return time >= start && time <= end;
    });
  };

  /**
   * 当 ref 的值发生变化时，该函数会重新 render
   */
  return () => {
    if (panel.value === 'year') {
      return (
        <TableYear
          calendar={innerCalendar.value}
          getCellClasses={getYearClasses}
          getYearPanel={props.getYearPanel}
          onSelect={handleSelectYear}
          onUpdateCalendar={handleCalendarChange}
        />
      );
    }
    if (panel.value === 'month') {
      return (
        <TableMonth
          calendar={innerCalendar.value}
          getCellClasses={getMonthClasses}
          onSelect={handleSelectMonth}
          onUpdatePanel={handelPanelChange}
          onUpdateCalendar={handleCalendarChange}
        />
      );
    }
    return (
      <TableDate
        isWeekMode={props.type === 'week'}
        showWeekNumber={props.showWeekNumber}
        titleFormat={props.titleFormat}
        calendar={innerCalendar.value}
        getCellClasses={getDateClasses}
        getWeekActive={getWeekActive}
        onSelect={handleSelectDate}
        onUpdatePanel={handelPanelChange}
        onUpdateCalendar={handleCalendarChange}
        onDateMouseEnter={props.onDateMouseEnter}
        onDateMouseLeave={props.onDateMouseLeave}
      />
    );
  };
}

export const calendarProps = keys<CalendarProps>()([
  'type',
  'value',
  'defaultValue',
  'defaultPanel',
  'disabledDate',
  'getClasses',
  'calendar',
  'multiple',
  'partialUpdate',
  'showWeekNumber',
  'titleFormat',
  'getYearPanel',
  'onDateMouseEnter',
  'onDateMouseLeave',
  'onCalendarChange',
  'onPanelChange',
  'onUpdate:value',
  'onPick',
]);

export default defineVueComponent(Calendar, calendarProps);
