export const debounce = (fn: Function, delay: number) => {
  let timeoutId: number | undefined;

  return (...args: any[]) => {
    clearTimeout(timeoutId);

    timeoutId = window.setTimeout(() => {
      fn(...args);
    }, delay);
  };
};
