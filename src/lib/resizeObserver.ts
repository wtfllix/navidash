export function createResizeObserver(
  callback: ResizeObserverCallback
): ResizeObserver | null {
  if (typeof window === 'undefined' || typeof window.ResizeObserver === 'undefined') {
    return null;
  }

  return new window.ResizeObserver(callback);
}
