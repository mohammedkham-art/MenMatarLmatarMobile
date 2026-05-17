import type {
  DealSort,
  TravelerType,
  TravelStyle,
  VisaFilter,
} from '../types';

export const travelerOptions: Array<{ label: string; value: TravelerType }> = [
  { label: 'Solo', value: 'solo' },
  { label: 'Couple', value: 'couple' },
  { label: 'Amis', value: 'friends' },
  { label: 'Famille', value: 'family' },
];

export const styleOptions: Array<{ label: string; value: TravelStyle }> = [
  { label: 'Budget', value: 'minimum' },
  { label: 'Équilibré', value: 'balanced' },
  { label: 'Confort', value: 'comfortable' },
];

export const visaFilterOptions: Array<{ label: string; value: VisaFilter }> = [
  { label: 'Tous', value: 'all' },
  { label: 'Sans visa', value: 'visa_free' },
  { label: 'eVisa', value: 'evisa' },
  { label: 'Arrivée', value: 'on_arrival' },
  { label: 'Visa requis', value: 'visa_required' },
];

export const dealSortOptions: Array<{ label: string; value: DealSort }> = [
  { label: 'Score', value: 'score' },
  { label: 'Prix ↑', value: 'price' },
  { label: 'Date', value: 'departure' },
];

export const simulatorSnapshots = [
  { days: '3J', budget: '2 000', city: 'Istanbul' },
  { days: '5J', budget: '4 500', city: 'Tunis' },
  { days: '7J', budget: '6 500', city: 'Bangkok' },
  { days: '4J', budget: '3 800', city: 'Le Caire' },
  { days: '10J', budget: '9 900', city: 'Bali' },
  { days: '6J', budget: '5 700', city: 'Doha' },
];
