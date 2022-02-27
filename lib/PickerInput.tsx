import { ref, InputHTMLAttributes, computed, SetupContext } from 'vue';
import { usePrefixClass } from './context';
import { IconClose, IconCalendar } from './svg';
import { ClassValue } from './type';
import { isValidDate, isValidDates, isValidRangeDate } from './util/date';
import { defineVueComponent, keys, withDefault } from './vueUtil';

// expose to datepicker
export interface PickerInputBaseProps {
  placeholder?: string;
  editable?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  inputClass?: ClassValue;
  inputAttr?: InputHTMLAttributes;
  range?: boolean;
  multiple?: boolean;
  separator?: string;
  renderInputText?: (v: Date | Date[]) => string;
  onInputError?: (text: string) => void;
  onClear?: () => void;
}

export interface PickerInputProps extends PickerInputBaseProps {
  value: Date | Date[];
  formatDate: (v: Date) => string;
  parseDate: (v: string) => Date;
  disabledDate: (v: Date) => boolean;
  onChange: (v: Date | Date[] | null | null[]) => void;
  onFocus: () => void;
  onBlur: () => void;
  onClick: () => void;
}

function PickerInput(originalProps: PickerInputProps, { slots }: SetupContext) {
  const props = withDefault(originalProps, {
    editable: true,
    disabled: false,
    clearable: true,
    range: false,
    multiple: false,
  });
  const prefixClass = usePrefixClass();

  const userInput = ref<string | null>(null);

  /**
   * 分隔符，可自定义设置。未指定时根据 props range 设置
   */
  const innerSeparator = computed(() => {
    return props.separator || (props.range ? ' ~ ' : ',');
  });

  /**
   * 检测一组日期是否为有效值
   * disabledDate 禁止选择的日期
   */
  const isValidValue = (value: unknown) => {
    if (props.range) {
      return isValidRangeDate(value) && value.every((date) => !props.disabledDate(date));
    }
    if (props.multiple) {
      return isValidDates(value) && value.every((date) => !props.disabledDate(date));
    }
    return isValidDate(value) && !props.disabledDate(value);
  };

  /**
   * 这里的计算属性应用有点奇怪，像 watch 侦听器函数的使用场景
   * 观察 userInput 值的变化，存在值时直接返回
   * 在代码中 handleChanghe 函数，每次 Input 值改变，手动设置 userInput 为 null，刻意执行
   * computed 中其他计算代码执行，计算最新的 text 值
   */
  const text = computed(() => {
    if (userInput.value !== null) {
      return userInput.value;
    }
    /**
     * Picker 组件支持 props.renderInputText，日期每次改变，用户可以自定义
     * 日期在 PickerInput 中显示的内容
     */
    if (typeof props.renderInputText === 'function') {
      return props.renderInputText(props.value);
    }
    if (!isValidValue(props.value)) {
      return '';
    }
    if (Array.isArray(props.value)) {
      return props.value.map((v) => props.formatDate(v)).join(innerSeparator.value);
    }
    return props.formatDate(props.value);
  });

  const handleClear = (evt?: Event) => {
    if (evt) {
      evt.stopPropagation();
    }
    props.onChange(props.range ? [null, null] : null);
    props.onClear?.();
  };

  /**
   * 输入 Enter 时触发
   */
  const handleChange = () => {
    /**
     * Enter 回车触发的条件是：
     *  1. 输入框不可以编辑
     *  2. 输入框的内容发生变化
     */
    if (!props.editable || userInput.value === null) return;
    const text = userInput.value.trim();
    userInput.value = null;
    if (text === '') {
      handleClear();
      return;
    }
    let date: Date | Date[];
    /**
     * 日期范围选择
     */
    if (props.range) {
      let arr = text.split(innerSeparator.value);
      if (arr.length !== 2) {
        // Maybe the separator during the day is the same as the separator for the date
        // eg: 2019-10-09-2020-01-02
        arr = text.split(innerSeparator.value.trim());
      }
      date = arr.map((v) => props.parseDate(v.trim()));
    } else if (props.multiple) {
      date = text.split(innerSeparator.value).map((v) => props.parseDate(v.trim()));
    } else {
      date = props.parseDate(text);
    }
    if (isValidValue(date)) {
      props.onChange(date);
    } else {
      props.onInputError?.(text);
    }
  };

  /**
   *  Input 的事件对象什么情况下会为 string 类型?
   */
  const handleInput = (evt: string | Event) => {
    userInput.value = typeof evt === 'string' ? evt : (evt.target as HTMLInputElement).value;
  };

  const handleKeydown = (evt: KeyboardEvent) => {
    const { key } = evt;
    if (key === 'Tab') {
      props.onBlur();
    } else if (key === 'Enter') {
      handleChange();
    }
  };

  return () => {
    /**
     * 显示清除按钮的情况
     */
    const showClearIcon = !props.disabled && props.clearable && text.value;

    /**
     * 存在自定义的 input 插槽时，inputProps 对象暴露给作用域插槽
     */
    const inputProps = {
      name: 'date',
      type: 'text',
      autocomplete: 'off',
      value: text.value,
      class: props.inputClass || `${prefixClass}-input`,
      readonly: !props.editable,
      disabled: props.disabled,
      placeholder: props.placeholder,
      ...props.inputAttr,
      onFocus: props.onFocus,
      onKeydown: handleKeydown,
      onInput: handleInput,
      onChange: handleChange,
    };

    return (
      <div class={`${prefixClass}-input-wrapper`} onClick={props.onClick}>
        {slots.input?.(inputProps) || <input {...inputProps} />}
        {showClearIcon ? (
          <i class={`${prefixClass}-icon-clear`} onClick={handleClear}>
            {slots['icon-clear']?.() || <IconClose />}
          </i>
        ) : null}
        <i class={`${prefixClass}-icon-calendar`}>
          {/* default icon config in DatePicker */}
          {slots['icon-calendar']?.() || <IconCalendar />}
        </i>
      </div>
    );
  };
}

export const pickerInputBaseProps = keys<PickerInputBaseProps>()([
  'placeholder',
  'editable',
  'disabled',
  'clearable',
  'inputClass',
  'inputAttr',
  'range',
  'multiple',
  'separator',
  'renderInputText',
  'onInputError',
  'onClear',
]);

const pickerInputProps = keys<PickerInputProps>()([
  'value',
  'formatDate',
  'parseDate',
  'disabledDate',
  'onChange',
  'onFocus',
  'onBlur',
  'onClick',
  ...pickerInputBaseProps,
]);

export default defineVueComponent(PickerInput, pickerInputProps);
