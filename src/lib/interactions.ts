/**
 * Discreet press feedback for clickable UI, applied consistently app-wide: a small scale-down
 * on :active. PRESS for normal-sized rows/cards/buttons, PRESS_SM for small icon-only controls
 * (the same relative scale reads as barely-there on a 40px+ surface but needs to shrink further
 * on a 16-28px target to be perceptible at all).
 */
export const PRESS = 'transition active:scale-[0.97]';
export const PRESS_SM = 'transition active:scale-90';
