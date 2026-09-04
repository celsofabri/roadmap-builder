import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '@/components/shared/Icon';
import sharedStyles from '@/styles/shared.module.scss';
import styles from './Modal.module.scss';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

export function Modal({ title, onClose, children, wide }: ModalProps) {
  // Closing plays a short exit animation before the parent actually unmounts
  // this component — see the animationend handler below.
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setClosing(true);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  function handleOverlayAnimationEnd(e: React.AnimationEvent<HTMLDivElement>) {
    // Ignore the panel's animation bubbling up — only the overlay's own
    // enter/exit animation should drive this.
    if (e.target !== e.currentTarget) return;
    if (closing) onClose();
  }

  return createPortal(
    <div
      className={`${styles.overlay} ${closing ? styles.overlayClosing : ''}`}
      onClick={() => setClosing(true)}
      onAnimationEnd={handleOverlayAnimationEnd}
      role="presentation"
    >
      <div
        className={`${styles.panel} ${wide ? styles.panelWide : ''} ${closing ? styles.panelClosing : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            type="button"
            onClick={() => setClosing(true)}
            className={sharedStyles.iconButton}
            aria-label="Fechar"
          >
            <CloseIcon size={16} />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
