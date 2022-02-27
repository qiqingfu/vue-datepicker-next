import { Transition, ref, watchEffect, Teleport, SetupContext, StyleValue } from 'vue';
import { usePrefixClass } from './context';
import { ClassValue } from './type';
import {
  getPopupElementSize,
  getRelativePosition,
  getScrollParent,
  mousedownEvent,
} from './util/dom';
import { rafThrottle } from './util/throttle';
import { withDefault, defineVueComponent, keys } from './vueUtil';

export interface PopupProps {
  style?: StyleValue;
  className?: ClassValue;
  visible: boolean;
  appendToBody?: boolean;
  onClickOutside: (evt: MouseEvent | TouchEvent) => void;
  getRelativeElement: () => HTMLElement | undefined;
}

/**
 * 弹出层组件
 */
function Popup(originalProps: PopupProps, { slots }: SetupContext) {
  const props = withDefault(originalProps, {
    appendToBody: true,
  });
  const prefixClass = usePrefixClass();
  const popup = ref<HTMLElement | null>(null);
  const position = ref({ left: '', top: '' });

  const displayPopup = () => {
    if (!props.visible || !popup.value) return;
    const relativeElement = props.getRelativeElement();
    if (!relativeElement) return;
    const { width, height } = getPopupElementSize(popup.value);
    position.value = getRelativePosition(relativeElement, width, height, props.appendToBody);
  };

  /**
   * flush：post 在组件更新后触发，这样你就可以访问更新的DOM
   * Vue3.2.0 提供更具语义化的watchPostEffect函数
   */
  watchEffect(displayPopup, { flush: 'post' });

  watchEffect(
    (onInvalidate) => {
      /**
       * 父级DOM元素
       */
      const relativeElement = props.getRelativeElement();
      if (!relativeElement) return;
      const scrollElement = getScrollParent(relativeElement) || window;
      const handleMove = rafThrottle(displayPopup);
      scrollElement.addEventListener('scroll', handleMove);
      /**
       * 浏览器窗口发生变化，displayPopup 函数执行重新计算位置
       */
      window.addEventListener('resize', handleMove);
      /**
       * 清除副作用 onInvalidate 函数
       *  1. 副作用即将重新执行时
       *  2. 侦听器被停止（如果在 setup() 或生命周期钩子函数中使用了 watchEffect，则在组件卸载时）
       */
      onInvalidate(() => {
        scrollElement.removeEventListener('scroll', handleMove);
        window.removeEventListener('resize', handleMove);
      });
    },
    { flush: 'post' }
  );

  const handleClickOutside = (evt: MouseEvent | TouchEvent) => {
    if (!props.visible) return;
    const target = evt.target as Node;
    const el = popup.value;
    const relativeElement = props.getRelativeElement();
    if (el && !el.contains(target) && relativeElement && !relativeElement.contains(target)) {
      props.onClickOutside(evt);
    }
  };

  watchEffect((onInvalidate) => {
    document.addEventListener(mousedownEvent, handleClickOutside);
    onInvalidate(() => {
      document.removeEventListener(mousedownEvent, handleClickOutside);
    });
  });

  return () => {
    return (
      <Teleport to="body" disabled={!props.appendToBody}>
        <Transition name={`${prefixClass}-zoom-in-down`}>
          {props.visible && (
            <div
              ref={popup}
              class={`${prefixClass}-datepicker-main ${prefixClass}-datepicker-popup ${props.className}`}
              style={[{ position: 'absolute', ...position.value }, props.style || {}]}
            >
              {slots.default?.()}
            </div>
          )}
        </Transition>
      </Teleport>
    );
  };
}

const popupProps = keys<PopupProps>()([
  'style',
  'className',
  'visible',
  'appendToBody',
  'onClickOutside',
  'getRelativeElement',
]);

export default defineVueComponent(Popup, popupProps);
