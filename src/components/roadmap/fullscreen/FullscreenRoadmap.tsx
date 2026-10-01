import { useEffect, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import type { Roadmap } from '@/types/roadmap.types';
import { TimelineSnapshot } from '@/components/roadmap/TimelineSnapshot';
import { CloseIcon, MaximizeIcon } from '@/components/shared/Icon';
import { LEGIBILITY_FLOOR } from '@/utils/fullscreenFit';
import { readShowTodayLine } from '@/utils/preferences';
import { useElementSize } from '@/utils/useElementSize';
import { useFullscreenMode, type FullscreenModeKind } from './useFullscreenMode';
import styles from './FullscreenRoadmap.module.scss';

/** Usable area of an A4 landscape sheet with 8mm margins, in CSS px (best effort, see README). */
const PRINT_VIEWPORT = { width: 1050, height: 720 };
/** Horizontal room kept for the "Sair" button so it never covers the header text. */
const CONTROLS_RESERVE = 130;
const NARROW_WINDOW = 768;

interface FullscreenOverlayProps {
  roadmap: Roadmap;
  showOwners: boolean;
  mode: FullscreenModeKind;
  onClose: () => void;
}

function FullscreenOverlay({ roadmap, showOwners, mode, onClose }: FullscreenOverlayProps) {
  const [viewportRef, size] = useElementSize<HTMLDivElement>();
  const exitRef = useRef<HTMLButtonElement>(null);
  // Preferences are read once on entering: the toolbar that edits them is not reachable here.
  const [showTodayLine] = useState(readShowTodayLine);
  const [printing, setPrinting] = useState(false);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    exitRef.current?.focus();
  }, []);

  // Best effort: the on-screen scale was computed for the window, not the sheet.
  useEffect(() => {
    function before() {
      flushSync(() => setPrinting(true));
    }
    function after() {
      setPrinting(false);
    }
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, []);

  const viewport = printing ? PRINT_VIEWPORT : size;
  const belowFloor = scale < LEGIBILITY_FLOOR;
  const showNotice = belowFloor && !noticeDismissed && size.width > 0;

  return createPortal(
    <div
      className={`${styles.overlay} ${printing ? styles.overlayPrinting : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={`Roadmap em tela cheia: ${roadmap.name}`}
      data-fullscreen-mode={mode}
    >
      <div ref={viewportRef} className={styles.viewport}>
        <TimelineSnapshot
          roadmap={roadmap}
          showOwners={showOwners}
          showTodayLine={showTodayLine}
          viewport={viewport}
          reserveRight={printing ? 0 : CONTROLS_RESERVE}
          onScaleChange={setScale}
        />
      </div>

      <button
        ref={exitRef}
        type="button"
        className={styles.exitButton}
        onClick={onClose}
        aria-keyshortcuts="Escape"
        title="Sair da tela cheia (Esc)"
      >
        <CloseIcon size={14} />
        Sair
      </button>

      {showNotice && (
        <div className={styles.notice} role="status">
          <span>
            Exibindo a {Math.round(scale * 100)}% para caber na tela.
            {size.width < NARROW_WINDOW && ' Gire o aparelho ou amplie a janela para ler melhor.'}
          </span>
          <button
            type="button"
            className={styles.noticeClose}
            onClick={() => setNoticeDismissed(true)}
            aria-label="Ocultar aviso de escala"
          >
            <CloseIcon size={12} />
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}

interface FullscreenRoadmapProps {
  roadmap: Roadmap;
  showOwners: boolean;
}

/**
 * "Tela cheia" button plus, while active, the overlay showing the whole roadmap read-only and
 * scaled to fit the window (for screenshots). Not persisted: a reload returns to the normal view.
 */
export function FullscreenRoadmap({ roadmap, showOwners }: FullscreenRoadmapProps) {
  const { open, mode, enter, close } = useFullscreenMode();
  const empty = roadmap.objectives.length === 0;

  // The overlay is not rendered when empty; close so inert, body class and native fullscreen go too.
  useEffect(() => {
    if (open && empty) close();
  }, [open, empty, close]);

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={(e) => enter(e.currentTarget)}
        disabled={empty}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={empty ? 'Adicione um objetivo para usar a tela cheia' : 'Ver o roadmap inteiro em tela cheia'}
      >
        <MaximizeIcon size={14} />
        Tela cheia
      </button>
      {open && !empty && (
        <FullscreenOverlay roadmap={roadmap} showOwners={showOwners} mode={mode} onClose={close} />
      )}
    </>
  );
}
