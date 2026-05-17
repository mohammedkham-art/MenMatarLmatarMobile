import { colors } from '../theme/colors';
import type {
  CountryVisaType,
  Country,
  DealVisaType,
  DestinationVisaType,
} from '../types';

export const visaLabels: Record<
  DealVisaType | DestinationVisaType | CountryVisaType,
  string
> = {
  visa_free: 'Sans visa',
  evisa: 'eVisa',
  e_visa: 'eVisa',
  on_arrival: "Visa à l'arrivée",
  visa_on_arrival: "Visa à l'arrivée",
  visa_required: 'Visa requis',
};

export function getVisaTone(
  visaType: DealVisaType | DestinationVisaType | CountryVisaType | null,
) {
  if (visaType === 'evisa' || visaType === 'e_visa') {
    return { backgroundColor: colors.blueSoft, color: colors.blue };
  }

  if (visaType === 'visa_required') {
    return { backgroundColor: colors.dangerSoft, color: colors.danger };
  }

  return { backgroundColor: colors.greenSoft, color: colors.green };
}

export function getVisaStatCount(
  countries: Country[],
  visaTypes: CountryVisaType[],
) {
  return countries.filter((country) => visaTypes.includes(country.visaType))
    .length;
}
