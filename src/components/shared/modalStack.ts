// Mount-order stack of every open Modal, so that when one opens on top of
// another (e.g. a ConfirmDialog over a management modal), Escape only closes
// the topmost one instead of both at once.
export const modalStack: symbol[] = [];

/** Whether any Modal is currently open. Lets other Escape handlers (e.g. fullscreen) yield to it. */
export function hasOpenModal(): boolean {
  return modalStack.length > 0;
}
