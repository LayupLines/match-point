// ABOUTME: Utilities for converting country codes and retrieving flag images
// ABOUTME: Maps ISO 3166-1 alpha-3 codes to alpha-2 codes for flag display

/**
 * Maps 3-letter ISO country codes (alpha-3) to 2-letter codes (alpha-2)
 * Used to convert database country codes to flag image filenames
 */
const COUNTRY_CODE_MAP: Record<string, string> = {
  SRB: 'rs',  // Serbia
  ESP: 'es',  // Spain
  ITA: 'it',  // Italy
  RUS: 'ru',  // Russia
  GER: 'de',  // Germany
  GRE: 'gr',  // Greece
  NOR: 'no',  // Norway
  USA: 'us',  // United States
  BUL: 'bg',  // Bulgaria
  POL: 'pl',  // Poland
  BLR: 'by',  // Belarus
  KAZ: 'kz',  // Kazakhstan
  TUN: 'tn',  // Tunisia
  CHN: 'cn',  // China
  CZE: 'cz',  // Czech Republic
  FRA: 'fr',  // France
  ARG: 'ar',  // Argentina
  NED: 'nl',  // Netherlands
  MON: 'mc',  // Monaco
  POR: 'pt',  // Portugal
  GBR: 'gb',  // Great Britain
  HUN: 'hu',  // Hungary
  CAN: 'ca',  // Canada
  AUS: 'au',  // Australia
  BRA: 'br',  // Brazil
  BEL: 'be',  // Belgium
  CRO: 'hr',  // Croatia
  BIH: 'ba',  // Bosnia and Herzegovina
  CHI: 'cl',  // Chile
  UKR: 'ua',  // Ukraine
  SUI: 'ch',  // Switzerland
  JPN: 'jp',  // Japan
  DEN: 'dk',  // Denmark
  ROU: 'ro',  // Romania
  COL: 'co',  // Colombia
  TUR: 'tr',  // Turkey
  INA: 'id',  // Indonesia
  LAT: 'lv',  // Latvia
  PHI: 'ph',  // Philippines
  AUT: 'at',  // Austria
  SVK: 'sk',  // Slovakia
  XXX: 'xx',  // Unknown/placeholder
}

/**
 * Get flag image path for a 3-letter country code
 * Returns path to flag SVG or fallback for unknown codes
 */
export function getFlagPath(countryCode: string | null | undefined): string {
  if (!countryCode) return '/flags/xx.svg'

  const alpha2Code = COUNTRY_CODE_MAP[countryCode.toUpperCase()]

  if (!alpha2Code) {
    console.warn(`Unknown country code: ${countryCode}, using placeholder flag`)
    return '/flags/xx.svg'
  }

  return `/flags/${alpha2Code}.svg`
}

/**
 * Get country name from 3-letter code for alt text and display
 */
export function getCountryName(countryCode: string | null | undefined): string {
  const names: Record<string, string> = {
    SRB: 'Serbia',
    ESP: 'Spain',
    ITA: 'Italy',
    RUS: 'Russia',
    GER: 'Germany',
    GRE: 'Greece',
    NOR: 'Norway',
    USA: 'United States',
    BUL: 'Bulgaria',
    POL: 'Poland',
    BLR: 'Belarus',
    KAZ: 'Kazakhstan',
    TUN: 'Tunisia',
    CHN: 'China',
    CZE: 'Czech Republic',
    FRA: 'France',
    ARG: 'Argentina',
    NED: 'Netherlands',
    MON: 'Monaco',
    POR: 'Portugal',
    GBR: 'Great Britain',
    HUN: 'Hungary',
    CAN: 'Canada',
    AUS: 'Australia',
    BRA: 'Brazil',
    BEL: 'Belgium',
    CRO: 'Croatia',
    BIH: 'Bosnia and Herzegovina',
    CHI: 'Chile',
    UKR: 'Ukraine',
    SUI: 'Switzerland',
    JPN: 'Japan',
    DEN: 'Denmark',
    ROU: 'Romania',
    COL: 'Colombia',
    TUR: 'Turkey',
    INA: 'Indonesia',
    LAT: 'Latvia',
    PHI: 'Philippines',
    AUT: 'Austria',
    SVK: 'Slovakia',
    XXX: 'Unknown',
  }

  return names[countryCode?.toUpperCase() || ''] || 'Unknown'
}
