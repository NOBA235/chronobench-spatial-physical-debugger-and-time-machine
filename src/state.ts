import { Types, createComponent } from '@iwsdk/core';
import { Vector3 } from 'three';
import type { Paradox } from './levels/ParadoxSchema';
import type { Stage } from './visuals/DioramaStageBuilder';

export const Plate = createComponent('Plate', { index: { type: Types.Float32, default: 0 } });
export const ORIGIN = new Vector3(0, 1.05, -0.55);
export const control = { timeScale: 1, frozen: false, scrub: 0, nudge: 0, levelRequest: -1, cursor: 0, name: '', rule: '', hit: false, chaos: null as Paradox | null, auto: false, seek: -1,
  tele: { levelIndex: 0, solveSeconds: 0, scrubCount: 0, freezeFrame: -1, elapsed: 0 } };
export const shared: {
  stage: Stage | null; dragging: boolean; view: { yaw: number; pitch: number; dist: number };
  onDown: ((e: PointerEvent) => boolean) | null; onMove: ((e: PointerEvent) => void) | null; onUp: (() => void) | null;
} = { stage: null, dragging: false, view: { yaw: 0, pitch: 0.3, dist: 1.25 }, onDown: null, onMove: null, onUp: null };
export const ChaosOrb = createComponent('ChaosOrb', {});
