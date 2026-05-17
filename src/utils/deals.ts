import type { Deal } from '../types';

export const recentPriceMaxAgeHours = 144;

export function getFreshnessLabel(deal: Deal) {
  const checkedAt = new Date(deal.lastCheckedAt ?? deal.createdAt);
  const diffHours = Math.floor(
    (Date.now() - checkedAt.getTime()) / (1000 * 60 * 60),
  );

  if (Number.isNaN(diffHours) || diffHours > recentPriceMaxAgeHours) {
    return 'À vérifier';
  }

  return 'Prix repéré récemment';
}

export function getTransitAirport(tags: string[]) {
  const transitTag = tags.find((tag) =>
    tag.toLowerCase().startsWith('transit:'),
  );

  return transitTag?.split(':')[1]?.trim().toUpperCase() ?? null;
}
