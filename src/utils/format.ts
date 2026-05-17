export function formatMad(value: number) {
  return `${value.toLocaleString('fr-MA')} MAD`;
}

export function formatDate(date: string | null) {
  if (!date) {
    return null;
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate);
}

export function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function getRefreshItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function formatThresholdCount(count: number, threshold = 40) {
  return count > threshold ? `+${threshold}` : String(count);
}
