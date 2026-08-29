import { useEffect, useRef, useState } from 'react';

/**
 * Tracks an element's content-box width. Used by the timeline to stretch the
 * day grid so a short period still fills the available width instead of
 * leaving dead space on the right.
 */
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    setWidth(element.clientWidth);

    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}
