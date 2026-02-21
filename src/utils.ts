
import * as THREE from 'three';

export function distToSegment(pX: number, pY: number, vX: number, vY: number, wX: number, wY: number): number {
  const l2 = (wX - vX) ** 2 + (wY - vY) ** 2;
  if (l2 === 0) return Math.hypot(pX - vX, pY - vY);
  let t = ((pX - vX) * (wX - vX) + (pY - vY) * (wY - vY)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = vX + t * (wX - vX);
  const projY = vY + t * (wY - vY);
  return Math.hypot(pX - projX, pY - projY);
}

export function vibrate(duration: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(duration);
    } catch (e) {
      // Ignore
    }
  }
}
