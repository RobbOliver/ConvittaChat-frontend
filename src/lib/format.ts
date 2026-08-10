export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function contactDisplayName(contact: { name: string | null; phoneNumber: string }) {
  return contact.name ?? contact.phoneNumber;
}

/** WhatsApp-style relative date: time for today, weekday name within the last week, else DD/MM/YY. */
export function formatSearchDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);

  if (diffDays <= 0) return formatTime(iso);
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) {
    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    return weekday.charAt(0).toUpperCase() + weekday.slice(1);
  }
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}
