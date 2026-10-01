import { useCallback, useEffect, useRef, useState } from 'react';
import { hasOpenModal } from '@/components/shared/modalStack';

/** Class added to `<body>` while open; the print stylesheet uses it to hide the app. */
export const BODY_OPEN_CLASS = 'rb-fullscreen-open';

export type FullscreenModeKind = 'native' | 'overlay';

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: (options?: FullscreenOptions) => Promise<void> | void;
};

const noop = () => {};

function nativeElement(doc: FullscreenDocument): Element | null {
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

function exitNative() {
  const doc = document as FullscreenDocument;
  if (!nativeElement(doc)) return;
  try {
    const result = (doc.exitFullscreen ?? doc.webkitExitFullscreen)?.call(doc);
    if (result && typeof result.catch === 'function') result.catch(noop);
  } catch {
    // Already leaving fullscreen, or the browser refused: the overlay closes regardless.
  }
}

/**
 * Fullscreen mode = a CSS overlay (always) + the browser Fullscreen API when available.
 * The overlay is the single source of truth for what is rendered; the native API only removes
 * the browser chrome, so denial or absence (e.g. iOS Safari) just means `mode === 'overlay'`.
 * See ADR-0003.
 */
export function useFullscreenMode() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<FullscreenModeKind>('overlay');
  const openRef = useRef(false);
  const modeRef = useRef<FullscreenModeKind>('overlay');
  const triggerRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    if (!openRef.current) return; // idempotent
    openRef.current = false;
    modeRef.current = 'overlay';
    setOpen(false);
    setMode('overlay');
    exitNative();
  }, []);

  // Must run synchronously inside the click handler: browsers only grant fullscreen to a gesture.
  const enter = useCallback((trigger?: HTMLElement | null) => {
    if (openRef.current) return;
    triggerRef.current = trigger ?? (document.activeElement as HTMLElement | null);
    openRef.current = true;
    modeRef.current = 'overlay';
    setOpen(true);
    setMode('overlay');

    const root = document.documentElement as FullscreenElement;
    const request = root.requestFullscreen ?? root.webkitRequestFullscreen;
    if (!request) return;
    try {
      const result = request.call(root, { navigationUI: 'hide' });
      Promise.resolve(result)
        .then(() => {
          if (openRef.current) {
            modeRef.current = 'native';
            setMode('native');
          } else {
            exitNative(); // user left before the browser answered
          }
        })
        .catch(noop);
    } catch {
      // Synchronous refusal (old WebKit): keep the overlay only.
    }
  }, []);

  // F7: if the browser leaves native fullscreen (Esc, F11), the app leaves with it.
  useEffect(() => {
    if (!open) return;
    function sync() {
      if (modeRef.current === 'native' && !nativeElement(document as FullscreenDocument)) close();
    }
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, [open, close]);

  // F5/F18: Esc leaves, unless a modal is open (then Esc belongs to the modal).
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !hasOpenModal()) close();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  // F20: make everything behind the overlay unreachable, and mark <body> for print CSS.
  useEffect(() => {
    if (!open) return;
    const root = document.getElementById('root');
    const wasInert = root?.hasAttribute('inert') ?? false;
    root?.setAttribute('inert', '');
    document.body.classList.add(BODY_OPEN_CLASS);
    return () => {
      if (root && !wasInert) root.removeAttribute('inert');
      document.body.classList.remove(BODY_OPEN_CLASS);
    };
  }, [open]);

  // F6: return focus to the control that opened the mode. Runs after #root is no longer inert.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !open) triggerRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  // Unmounted while open (e.g. roadmap closed): do not leave the browser in fullscreen.
  useEffect(
    () => () => {
      if (openRef.current) {
        openRef.current = false;
        exitNative();
      }
    },
    [],
  );

  return { open, mode, enter, close };
}
