import type { NotifySignal } from '../types';

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioContext) audioContext = new Ctor();
  return audioContext;
}

/** One tone with a short linear fade-in/out, so consecutive beeps never click at their edges. */
function beep(ctx: AudioContext, frequency: number, startTime: number, durationSec: number, peakGain: number): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  const fade = Math.min(0.02, durationSec / 4);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + fade);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + durationSec - fade);
  gain.gain.linearRampToValueAtTime(0, startTime + durationSec);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + durationSec);
}

/** One ascending two-tone chime, starting at `startTime` — returns when it finishes, so callers
 * can chain repeats back to back without overlapping. */
function chime(ctx: AudioContext, startTime: number): number {
  beep(ctx, 660, startTime, 0.18, 0.14);
  beep(ctx, 880, startTime + 0.2, 0.22, 0.14);
  return startTime + 0.42;
}

const ORDER_READY_REPEATS = 3;
const ORDER_READY_GAP_SEC = 0.25;

/**
 * Synthesized (no audio asset file) so this ships as a few lines of code, not a binary to manage —
 * `HUMAN_NEEDED` is two quick, higher-pitched beeps (deliberately reads as "come look now"),
 * `ORDER_READY` is a calmer ascending two-tone chime repeated 3x in a row (an order confirmation
 * should be hard to miss even if nobody's looking at the screen right when it lands, but it's
 * still an FYI, not an alarm — that's why it's calmer-pitched, not why it's quiet). Silently does
 * nothing if the browser has no Web Audio API or the AudioContext is blocked — this is a courtesy
 * alert on top of the (always-shown) inbox badge/toast, never the only way to notice something
 * happened.
 */
export function playNotificationSound(signal: NotifySignal): void {
  const ctx = getContext();
  if (!ctx) return;

  const schedule = () => {
    // Read AFTER resume() settles, not before — capturing `currentTime` while still suspended and
    // scheduling against it produces a stale timestamp that can already be in the past by the time
    // the context actually starts running, silently dropping the very first play after a fresh
    // page load with no prior user gesture (the exact case an autoplay-policy browser blocks).
    const now = ctx.currentTime;
    if (signal === 'HUMAN_NEEDED') {
      beep(ctx, 880, now, 0.15, 0.18);
      beep(ctx, 880, now + 0.22, 0.15, 0.18);
      return;
    }
    let t = now;
    for (let i = 0; i < ORDER_READY_REPEATS; i++) {
      t = chime(ctx, t) + (i < ORDER_READY_REPEATS - 1 ? ORDER_READY_GAP_SEC : 0);
    }
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(schedule).catch(() => {});
  } else {
    schedule();
  }
}
