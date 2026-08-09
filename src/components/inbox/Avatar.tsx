import { getInitials } from '../../lib/format';

interface Props {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md';
  tone?: 'dark' | 'light';
}

const SIZE_CLASSES: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-9 w-9 text-sm',
  md: 'h-10 w-10 text-sm',
};

const TONE_CLASSES: Record<NonNullable<Props['tone']>, string> = {
  dark: 'bg-white/10 text-white',
  light: 'bg-mist text-ink',
};

export function Avatar({ name, avatarUrl, size = 'sm', tone = 'dark' }: Props) {
  const sizeClass = SIZE_CLASSES[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-semibold ${sizeClass} ${TONE_CLASSES[tone]}`}
    >
      {getInitials(name)}
    </span>
  );
}
