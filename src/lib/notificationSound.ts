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

/**
 * Synthesized (no audio asset file) so this ships as a few lines of code, not a binary to manage —
 * `HUMAN_NEEDED` is two quick, higher-pitched beeps (deliberately reads as "come look now"),
 * `ORDER_READY` is a calmer ascending two-tone chime (an FYI, not an alarm). Silently does nothing
 * if the browser has no Web Audio API or the AudioContext is blocked — this is a courtesy alert on
 * top of the (always-shown) inbox badge/toast, never the only way to notice something happened.
 */
export function playNotificationSound(signal: NotifySignal): void {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {});

  const now = ctx.currentTime;
  if (signal === 'HUMAN_NEEDED') {
    beep(ctx, 880, now, 0.15, 0.18);
    beep(ctx, 880, now + 0.22, 0.15, 0.18);
  } else {
    beep(ctx, 660, now, 0.18, 0.14);
    beep(ctx, 880, now + 0.2, 0.22, 0.14);
  }
}
