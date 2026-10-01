import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest runs without `globals`, so Testing Library cannot register its own
// automatic cleanup — do it here. No-op in node-environment tests.
afterEach(() => {
  cleanup();
});

// jsdom has no layout engine and no ResizeObserver. A no-op stub keeps components that
// observe size from crashing; layout itself is verified manually (see ADR-0002).
if (typeof window !== 'undefined' && typeof window.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}
