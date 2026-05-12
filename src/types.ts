export type DealVisaType =
  | 'visa_free'
  | 'evisa'
  | 'e_visa'
  | 'on_arrival'
  | 'visa_on_arrival'
  | 'visa_required';

export type Deal = {
  id: string;
  title: string;
  fromAirport: string;
  toAirport: string;
  fromCity: string;
  toCity: string;
  countryCode: string;
  visaType: DealVisaType | null;
  priceMad: number;
  airline: string | null;
  departureDate: string | null;
  returnDate: string | null;
  bookingUrl: string;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  score: number;
  lastCheckedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type DestinationVisaType =
  | 'visa_free'
  | 'evisa'
  | 'e_visa'
  | 'on_arrival'
  | 'visa_on_arrival'
  | 'visa_required';

export type CountryVisaType = DestinationVisaType;

export type Destination = {
  id: string;
  city: string;
  country: string;
  countryCode: string | null;
  region: string | null;
  visaType: DestinationVisaType | null;
  isFeatured: boolean;
};

export type Country = {
  id: string;
  name: string;
  code: string;
  region: string;
  visaType: CountryVisaType;
  maxStayDays: number | null;
  notes: string | null;
  officialSourceUrl: string | null;
  isFeatured: boolean;
};

export type TravelerType = 'solo' | 'couple' | 'friends' | 'family';
export type TravelStyle = 'minimum' | 'balanced' | 'comfortable';

export type TripSimulationRequest = {
  destinationId: string;
  destinationCity: string;
  destinationCountry: string;
  destinationCountryCode: string | null;
  visaType: DestinationVisaType | null;
  arrivalDate: string;
  durationDays: number;
  budgetMad?: number;
  travelerType: TravelerType;
  travelStyle: TravelStyle;
};

export type TripSimulationResult = {
  title: string;
  destinationCity: string;
  destinationCountry: string;
  durationDays: number;
  budgetMad: number;
  estimatedDailyBudgetMad: number;
  summary: string;
  budgetWarning: string | null;
  budgetBreakdown: {
    lodgingMad: number;
    foodMad: number;
    localTransportMad: number;
    activitiesMad: number;
    bufferMad: number;
  };
  dayPlans: Array<{
    day: number;
    title: string;
    morning: string;
    afternoon: string;
    evening: string;
    budgetTip: string;
  }>;
  transportTips: string[];
  foodTips: string[];
  passportVisaNotes: string[];
};
