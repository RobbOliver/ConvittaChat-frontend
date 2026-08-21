import { useEffect, useState } from 'react';
import { getInitials } from '../../lib/format';

interface Props {
  name: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md';
  tone?: 'dark' | 'light';
}

const SIZE_CLASSES: Record<NonNullable<Props['size']>, string> = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-9 w-9 text-sm',
  md: 'h-10 w-10 text-sm',
};

const TONE_CLASSES: Record<NonNullable<Props['tone']>, string> = {
  dark: 'bg-white/10 text-white',
  light: 'bg-mist text-ink dark:bg-[#24252e] dark:text-[#ececed]',
};

export function Avatar({ name, avatarUrl, size = 'sm', tone = 'dark' }: Props) {
  const sizeClass = SIZE_CLASSES[size];
  const [failed, setFailed] = useState(false);

  // A newly-arrived avatarUrl (e.g. from the profile-picture backfill) deserves a fresh attempt,
  // even if a previous, now-expired WhatsApp CDN link had failed to load.
  useEffect(() => {
    setFailed(false);
  }, [avatarUrl]);

  if (avatarUrl && !failed) {
    return (
      <img
        src={avatarUrl}
        alt=""
        onError={() => setFailed(true)}
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
