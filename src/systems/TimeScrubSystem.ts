import { createSystem } from '@iwsdk/core';
import { MathUtils, Vector3 } from 'three';
import { audio } from '../audio/ChronoSynthAudio';
import { control } from '../state';

const RIGHT = new Vector3();
const keys = { left: false, right: false };

export class TimeScrubSystem extends createSystem({}) {
  private left: any = null;
  private latched = false;
  private deskFrozen = false;

  init(): void {
    const xr = this.world.renderer.xr;
    for (let i = 0; i < 2; i++) {
      const hand = xr.getHand(i);
      this.scene.add(hand);
      hand.addEventListener('connected', (e: any) => { if (e.data?.handedness === 'left') this.left = hand; });
      hand.addEventListener('disconnected', () => { if (this.left === hand) this.left = null; });
    }
    const key = (e: KeyboardEvent, down: boolean) => {
      audio.resume();
      if (e.code === 'ArrowLeft' || e.code === 'KeyQ') keys.left = down;
      else if (e.code === 'ArrowRight' || e.code === 'KeyE') keys.right = down;
      else if (e.code === 'Space' && down && !e.repeat) this.deskFrozen = !this.deskFrozen;
      else if (down && e.code >= 'Digit1' && e.code <= 'Digit5') control.levelRequest = Number(e.code.slice(5)) - 1;
    };
    window.addEventListener('keydown', (e) => key(e, true));
    window.addEventListener('keyup', (e) => key(e, false));
    window.addEventListener('pointerdown', () => audio.resume());
    window.addEventListener('wheel', (e) => { control.nudge += e.deltaY * 0.05; });
  }

  update(): void {
    if (control.auto) return;
    const j = this.left?.joints;
    const wrist = j?.['wrist'], thumb = j?.['thumb-tip'], index = j?.['index-finger-tip'];
    if (wrist && thumb && index) {
      const gap = thumb.position.distanceTo(index.position);
      if (gap < 0.018) this.latched = true; else if (gap > 0.028) this.latched = false;
      const pinch = this.latched;
      RIGHT.set(1, 0, 0).applyQuaternion(wrist.quaternion);
      const roll = Math.asin(MathUtils.clamp(RIGHT.y, -1, 1));
      const u = MathUtils.clamp((Math.abs(roll) - 0.2) / 1.0, 0, 1);
      control.timeScale = roll > 0 ? 1 + 1.5 * u : 1 - 3.5 * u;
      if (pinch && !control.frozen) audio.resume();
      control.frozen = pinch;
    } else {
      control.timeScale = 1;
      control.scrub = keys.left ? -1 : keys.right ? 1 : 0;
      control.frozen = this.deskFrozen;
    }
  }
}
