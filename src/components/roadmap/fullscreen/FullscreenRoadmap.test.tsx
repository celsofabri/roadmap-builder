// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeRoadmap } from '@/test/fixtures';
import { Modal } from '@/components/shared/Modal';
import { FullscreenRoadmap } from './FullscreenRoadmap';

let appRoot: HTMLElement;
let fullscreenElement: Element | null;

function renderIt(roadmap = makeRoadmap()) {
  return render(<FullscreenRoadmap roadmap={roadmap} showOwners />, { container: appRoot });
}

const trigger = () => screen.getByRole('button', { name: /Tela cheia/ });

async function open(user = userEvent.setup()) {
  await user.click(trigger());
  return user;
}

function stubNative(impl?: () => Promise<void>) {
  const request = vi.fn(
    impl ??
      (() => {
        fullscreenElement = document.documentElement;
        return Promise.resolve();
      }),
  );
  const exit = vi.fn(() => {
    fullscreenElement = null;
    return Promise.resolve();
  });
  Object.defineProperty(document.documentElement, 'requestFullscreen', {
    configurable: true,
    value: request,
  });
  Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exit });
  Object.defineProperty(document, 'fullscreenElement', {
    configurable: true,
    get: () => fullscreenElement,
  });
  return { request, exit };
}

function removeNative() {
  // @ts-expect-error test cleanup of the stubbed property
  delete document.documentElement.requestFullscreen;
}

describe('FullscreenRoadmap', () => {
  beforeEach(() => {
    localStorage.clear();
    fullscreenElement = null;
    appRoot = document.createElement('div');
    appRoot.id = 'root';
    document.body.appendChild(appRoot);
  });
  afterEach(() => {
    removeNative();
    appRoot.remove();
  });

  it('F13: button is disabled with an explanation when there are no objectives', () => {
    renderIt(makeRoadmap({ objectives: [] }));
    expect(trigger()).toBeDisabled();
    expect(trigger()).toHaveAttribute('title', 'Adicione um objetivo para usar a tela cheia');
  });

  it('closes the mode (inert, body class, native fullscreen) if the roadmap becomes empty while open', async () => {
    const view = renderIt();
    await open();
    expect(appRoot).toHaveAttribute('inert');
    view.rerender(<FullscreenRoadmap roadmap={makeRoadmap({ objectives: [] })} showOwners />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(appRoot).not.toHaveAttribute('inert');
    expect(document.body).not.toHaveClass('rb-fullscreen-open');
  });

  it('F8: opens as a CSS overlay when the Fullscreen API does not exist', async () => {
    renderIt();
    await open();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('data-fullscreen-mode', 'overlay');
    expect(dialog).toBeInTheDocument();
  });

  it('F20: dialog has role, label, focus on Sair, and #root becomes inert', async () => {
    renderIt();
    await open();
    const dialog = screen.getByRole('dialog', { name: 'Roadmap em tela cheia: Roadmap de teste' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: /Sair/ })).toHaveFocus();
    expect(appRoot).toHaveAttribute('inert');
    expect(document.body).toHaveClass('rb-fullscreen-open');
  });

  it('F4: the overlay has no edit controls other than Sair', async () => {
    renderIt();
    await open();
    const dialog = screen.getByRole('dialog');
    const buttons = Array.from(dialog.querySelectorAll('button'));
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Sair']);
    expect(dialog.querySelector('[role="button"], a, input')).toBeNull();
  });

  it('F6: Sair closes the mode and returns focus to the Tela cheia button', async () => {
    renderIt();
    const user = await open();
    await user.click(screen.getByRole('button', { name: /Sair/ }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(appRoot).not.toHaveAttribute('inert');
    expect(document.body).not.toHaveClass('rb-fullscreen-open');
    expect(trigger()).toHaveFocus();
  });

  it('F5: Esc closes the mode and changes no data', async () => {
    const roadmap = makeRoadmap();
    const before = JSON.stringify(roadmap);
    renderIt(roadmap);
    const user = await open();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
    expect(JSON.stringify(roadmap)).toBe(before);
  });

  it('F18: with a modal open, the first Esc only closes the modal; the second leaves the mode', async () => {
    renderIt();
    const user = await open();
    function Host() {
      return (
        <Modal title="Outro" onClose={() => {}}>
          conteúdo
        </Modal>
      );
    }
    const modal = render(<Host />);
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog', { name: /Roadmap em tela cheia/ })).toBeInTheDocument();
    // Finish the modal's exit animation so it unmounts and leaves the stack.
    const overlay = screen.getByRole('dialog', { name: 'Outro' }).parentElement as HTMLElement;
    fireEvent.animationEnd(overlay);
    modal.unmount();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  describe('native Fullscreen API', () => {
    it('F7: requests fullscreen on click, reports native mode, and syncs when the browser exits', async () => {
      const { request, exit } = stubNative();
      renderIt();
      await open();
      expect(request).toHaveBeenCalledTimes(1);
      expect(request.mock.calls[0]).toEqual([{ navigationUI: 'hide' }]);
      expect(screen.getByRole('dialog')).toHaveAttribute('data-fullscreen-mode', 'native');

      // The browser leaves fullscreen on its own (native Esc).
      await act(async () => {
        fullscreenElement = null;
        document.dispatchEvent(new Event('fullscreenchange'));
      });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(exit).not.toHaveBeenCalled(); // already out, nothing to exit
    });

    it('leaving through the app also leaves native fullscreen', async () => {
      const { exit } = stubNative();
      renderIt();
      const user = await open();
      await user.click(screen.getByRole('button', { name: /Sair/ }));
      expect(exit).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('a fullscreenchange while still in fullscreen does not close the overlay', async () => {
      stubNative();
      renderIt();
      await open();
      await act(async () => {
        document.dispatchEvent(new Event('fullscreenchange'));
      });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('falls back to the overlay when the request is denied', async () => {
      stubNative(() => Promise.reject(new Error('denied')));
      renderIt();
      await open();
      expect(screen.getByRole('dialog')).toHaveAttribute('data-fullscreen-mode', 'overlay');
    });

    it('falls back to the overlay when the request throws synchronously', async () => {
      stubNative(() => {
        throw new Error('nope');
      });
      renderIt();
      await open();
      expect(screen.getByRole('dialog')).toHaveAttribute('data-fullscreen-mode', 'overlay');
    });
  });

  it('F21: nothing is persisted, and a fresh mount starts closed', async () => {
    const { unmount } = renderIt();
    await open();
    expect(localStorage.length).toBe(0);
    unmount();
    render(<FullscreenRoadmap roadmap={makeRoadmap()} showOwners />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('F12: reads the today-line preference when opening', async () => {
    localStorage.setItem('roadmap-builder:show-today-line', '1');
    renderIt(makeRoadmap({ period: { startDate: '2020-01-01', endDate: '2099-12-31' } }));
    await open();
    expect(screen.getByTestId('snapshot-today-line')).toBeInTheDocument();
  });

  it('F12: today line stays off when the toolbar preference is off', async () => {
    localStorage.setItem('roadmap-builder:show-today-line', '0');
    renderIt(makeRoadmap({ period: { startDate: '2020-01-01', endDate: '2099-12-31' } }));
    await open();
    expect(screen.queryByTestId('snapshot-today-line')).not.toBeInTheDocument();
  });
});
