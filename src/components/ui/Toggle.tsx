import { PRESS_SM } from '../../lib/interactions';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
}

/** A small on/off switch — used for the account-wide and per-conversation AI toggles. `label` is
 * required and visually hidden, not decorative — this is a real form control, not an icon button. */
export function Toggle({ checked, onChange, disabled, label }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full disabled:opacity-50 ${PRESS_SM} ${
        checked ? 'bg-signal' : 'bg-line'
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
