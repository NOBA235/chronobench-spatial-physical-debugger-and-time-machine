import { shared } from '../state';

/** Installed before World.create so it is the first capture listener on window: anchor drags never reach camera controls. */
export function installPointerGuard(): void {
  const opts = { capture: true, passive: false } as const;
  const eat = (e: Event) => { e.stopImmediatePropagation(); e.stopPropagation(); if (e.cancelable) e.preventDefault(); };
  window.addEventListener('pointerdown', (e) => { if (shared.onDown?.(e)) eat(e); }, opts);
  window.addEventListener('pointermove', (e) => { if (shared.dragging) { shared.onMove?.(e); eat(e); } }, opts);
  window.addEventListener('pointerup', (e) => { if (shared.dragging) { shared.onUp?.(); eat(e); } }, opts);
  for (const t of ['mousedown', 'mousemove', 'mouseup', 'touchstart', 'touchmove', 'touchend', 'contextmenu'])
    window.addEventListener(t, (e) => { if (shared.dragging) eat(e); }, opts);
}
