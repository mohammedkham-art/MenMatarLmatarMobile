const ACCENT_MAP: Record<string, string> = {
  Depart: 'Départ',
  Retour: 'Retour',
  Escale: 'Escale',
  'Sejour indicatif': 'Séjour indicatif',
  Sejour: 'Séjour',
  "Visa a l'arrivee": "Visa à l'arrivée",
  'Visa a l arrivee': "Visa à l'arrivée",
  'Avant de reserver': 'Avant de réserver',
  'Bon deal': 'Bon deal',
  'Bon prix': 'Bon prix',
  'Offre eclair': 'Offre éclair',
};

export function normalizeText(str: string): string {
  return ACCENT_MAP[str] ?? str;
}
