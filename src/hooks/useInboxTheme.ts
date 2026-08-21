import { useEffect, useState } from 'react';

export type InboxTheme = 'light' | 'dark';

const STORAGE_KEY = 'convitta.inboxTheme';

function readStoredTheme(): InboxTheme {
  return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

/** Light/dark is a manual choice scoped to the Inbox screen only — not tied to the OS theme, and
 * remembered per browser so it doesn't reset every visit. */
export function useInboxTheme() {
  const [theme, setTheme] = useState<InboxTheme>(readStoredTheme);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  return { theme, toggleTheme };
}
