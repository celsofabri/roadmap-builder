import { useLayoutEffect, useRef, useState } from 'react';

export interface ElementSize {
  width: number;
  height: number;
}

/**
 * Tracks an element's layout size (`offsetWidth/Height`, which CSS transforms do not affect).
 * Separate from `useElementWidth` on purpose: the interactive timeline keeps using that one.
 */
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    function measure() {
      const target = ref.current;
      if (!target) return;
      const next = { width: target.offsetWidth, height: target.offsetHeight };
      setSize((prev) =>
        prev.width === next.width && prev.height === next.height ? prev : next,
      );
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}
