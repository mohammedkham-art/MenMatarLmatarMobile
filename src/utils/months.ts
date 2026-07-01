import type { Deal } from '../types';

export type MonthValue = { year: number; month: number }; // month 1-based

export function toMonthKey(m: MonthValue): number {
  return m.year * 100 + m.month;
}

export function getRollingMonths(): MonthValue[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
}

export function formatMonthName(m: MonthValue): string {
  return new Intl.DateTimeFormat('fr-FR', { month: 'short' })
    .format(new Date(m.year, m.month - 1, 1))
    .replace('.', '');
}

export function formatMonthLabel(m: MonthValue): string {
  return new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' })
    .format(new Date(m.year, m.month - 1, 1))
    .replace('.', '');
}

export function getMonthState(
  m: MonthValue,
  from: MonthValue | null,
  to: MonthValue | null,
): 'start' | 'end' | 'in-range' | 'none' {
  if (!from) return 'none';
  const key = toMonthKey(m);
  const fromKey = toMonthKey(from);
  const toKey = to ? toMonthKey(to) : fromKey;
  if (key === fromKey && fromKey === toKey) return 'start';
  if (key === fromKey) return 'start';
  if (key === toKey) return 'end';
  if (key > fromKey && key < toKey) return 'in-range';
  return 'none';
}

export function dealInMonthRange(
  deal: Deal,
  from: MonthValue,
  to: MonthValue,
): boolean {
  if (!deal.departureDate) return false;
  const d = new Date(deal.departureDate);
  const key = d.getFullYear() * 100 + (d.getMonth() + 1);
  return key >= toMonthKey(from) && key <= toMonthKey(to);
}
