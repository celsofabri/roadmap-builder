// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Modal } from './Modal';
import { hasOpenModal } from './modalStack';

describe('hasOpenModal', () => {
  it('is false with no modal, true while one is mounted, false after unmount', () => {
    expect(hasOpenModal()).toBe(false);
    const { unmount } = render(
      <Modal title="X" onClose={() => {}}>
        corpo
      </Modal>,
    );
    expect(hasOpenModal()).toBe(true);
    unmount();
    expect(hasOpenModal()).toBe(false);
  });
});
