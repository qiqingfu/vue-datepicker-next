/* istanbul ignore file */
/**
 * 节流函数
 */
export function rafThrottle<T extends (...args: any[]) => void>(fn: T) {
  let isRunning = false;
  return function fnBinfRaf(this: any, ...args: Parameters<T>) {
    if (isRunning) return;
    isRunning = true;
    requestAnimationFrame(() => {
      isRunning = false;
      fn.apply(this, args);
    });
  };
}
