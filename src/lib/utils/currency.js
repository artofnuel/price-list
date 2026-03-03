/**
 * Maps a profile region string to a native currency symbol and code.
 * Falls back to USD if the region is unknown.
 */
const REGION_CURRENCY_MAP = {
  // Africa
  nigeria: { symbol: '₦', code: 'NGN', name: 'Nigerian Naira' },
  ghana: { symbol: '₵', code: 'GHS', name: 'Ghanaian Cedi' },
  kenya: { symbol: 'KSh', code: 'KES', name: 'Kenyan Shilling' },
  'south africa': { symbol: 'R', code: 'ZAR', name: 'South African Rand' },
  egypt: { symbol: 'E£', code: 'EGP', name: 'Egyptian Pound' },
  ethiopia: { symbol: 'Br', code: 'ETB', name: 'Ethiopian Birr' },
  tanzania: { symbol: 'TSh', code: 'TZS', name: 'Tanzanian Shilling' },
  uganda: { symbol: 'USh', code: 'UGX', name: 'Ugandan Shilling' },
  senegal: { symbol: 'CFA', code: 'XOF', name: 'West African CFA Franc' },
  cameroon: { symbol: 'CFA', code: 'XAF', name: 'Central African CFA Franc' },

  // Europe
  uk: { symbol: '£', code: 'GBP', name: 'British Pound' },
  'united kingdom': { symbol: '£', code: 'GBP', name: 'British Pound' },
  'great britain': { symbol: '£', code: 'GBP', name: 'British Pound' },
  germany: { symbol: '€', code: 'EUR', name: 'Euro' },
  france: { symbol: '€', code: 'EUR', name: 'Euro' },
  spain: { symbol: '€', code: 'EUR', name: 'Euro' },
  italy: { symbol: '€', code: 'EUR', name: 'Euro' },
  netherlands: { symbol: '€', code: 'EUR', name: 'Euro' },
  portugal: { symbol: '€', code: 'EUR', name: 'Euro' },
  belgium: { symbol: '€', code: 'EUR', name: 'Euro' },
  switzerland: { symbol: 'CHF', code: 'CHF', name: 'Swiss Franc' },
  sweden: { symbol: 'kr', code: 'SEK', name: 'Swedish Krona' },
  norway: { symbol: 'kr', code: 'NOK', name: 'Norwegian Krone' },
  denmark: { symbol: 'kr', code: 'DKK', name: 'Danish Krone' },
  poland: { symbol: 'zł', code: 'PLN', name: 'Polish Złoty' },
  ukraine: { symbol: '₴', code: 'UAH', name: 'Ukrainian Hryvnia' },

  // Americas
  'united states': { symbol: '$', code: 'USD', name: 'US Dollar' },
  usa: { symbol: '$', code: 'USD', name: 'US Dollar' },
  us: { symbol: '$', code: 'USD', name: 'US Dollar' },
  canada: { symbol: 'CA$', code: 'CAD', name: 'Canadian Dollar' },
  brazil: { symbol: 'R$', code: 'BRL', name: 'Brazilian Real' },
  mexico: { symbol: 'MX$', code: 'MXN', name: 'Mexican Peso' },
  argentina: { symbol: '$', code: 'ARS', name: 'Argentine Peso' },
  colombia: { symbol: '$', code: 'COP', name: 'Colombian Peso' },

  // Asia-Pacific
  india: { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
  china: { symbol: '¥', code: 'CNY', name: 'Chinese Yuan' },
  japan: { symbol: '¥', code: 'JPY', name: 'Japanese Yen' },
  'south korea': { symbol: '₩', code: 'KRW', name: 'South Korean Won' },
  indonesia: { symbol: 'Rp', code: 'IDR', name: 'Indonesian Rupiah' },
  philippines: { symbol: '₱', code: 'PHP', name: 'Philippine Peso' },
  pakistan: { symbol: '₨', code: 'PKR', name: 'Pakistani Rupee' },
  bangladesh: { symbol: '৳', code: 'BDT', name: 'Bangladeshi Taka' },
  thailand: { symbol: '฿', code: 'THB', name: 'Thai Baht' },
  vietnam: { symbol: '₫', code: 'VND', name: 'Vietnamese Dong' },
  singapore: { symbol: 'S$', code: 'SGD', name: 'Singapore Dollar' },
  malaysia: { symbol: 'RM', code: 'MYR', name: 'Malaysian Ringgit' },
  australia: { symbol: 'A$', code: 'AUD', name: 'Australian Dollar' },
  'new zealand': { symbol: 'NZ$', code: 'NZD', name: 'New Zealand Dollar' },

  // Middle East
  'saudi arabia': { symbol: '﷼', code: 'SAR', name: 'Saudi Riyal' },
  'united arab emirates': { symbol: 'AED', code: 'AED', name: 'UAE Dirham' },
  uae: { symbol: 'AED', code: 'AED', name: 'UAE Dirham' },
  dubai: { symbol: 'AED', code: 'AED', name: 'UAE Dirham' },
  qatar: { symbol: 'QR', code: 'QAR', name: 'Qatari Riyal' },
  israel: { symbol: '₪', code: 'ILS', name: 'Israeli Shekel' },
}

const DEFAULT_CURRENCY = { symbol: '$', code: 'USD', name: 'US Dollar' }

/**
 * Get the currency for a given region string.
 * @param {string|null|undefined} region - e.g. "Nigeria", "UK", "United States"
 * @returns {{ symbol: string, code: string, name: string }}
 */
export function getCurrencyForRegion(region) {
  if (!region) return DEFAULT_CURRENCY
  const key = region.trim().toLowerCase()
  return REGION_CURRENCY_MAP[key] ?? DEFAULT_CURRENCY
}
