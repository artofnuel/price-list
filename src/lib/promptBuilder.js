import { getCurrencyForRegion } from '@/lib/utils/currency'

/**
 * Builds the Gemini prompt from a professional profile and service list.
 * Currency is determined from the profile's region so the AI generates
 * native-currency prices rather than defaulting to USD.
 *
 * @param {Object} profile - The professional profile
 * @param {string[]} services - Array of service names/descriptions
 * @returns {string} - The full prompt string
 */
export function buildPrompt(profile, services) {
  const {
    profession,
    experience_years,
    skill_level,
    target_market,
    region,
  } = profile

  const serviceList = services.length > 0
    ? services.join(', ')
    : 'general services'

  const regionStr = region ? ` based in ${region}` : ''

  // Resolve the native currency for this region
  const currency = getCurrencyForRegion(region)
  const currencyContext = `${currency.name} (${currency.code}, symbol: ${currency.symbol})`
  const examplePrice = `${currency.symbol}000`

  return `You are a professional pricing consultant. Generate a structured price list for the following professional:

PROFESSIONAL PROFILE:
- Profession: ${profession}
- Experience: ${experience_years} year(s)
- Skill Level: ${skill_level}
- Target Market: ${target_market}
- Location: ${region || 'Not specified'}

SERVICES TO PRICE: ${serviceList}

INSTRUCTIONS:
- Create realistic, market-appropriate pricing for a ${skill_level.toLowerCase()} ${profession}${regionStr} targeting the ${target_market.toLowerCase()} market
- IMPORTANT: All prices MUST be in ${currencyContext}. Do NOT use USD unless the region is the United States.
- Use realistic local market rates — for example, a Nigerian freelancer should charge in Naira at Nigerian market rates, not USD rates converted to Naira.
- Structure exactly 3 pricing tiers: Basic, Standard, and Premium
- For each tier provide: name, description, price (numeric, in ${currency.code}), list of included services, and 2-3 add-ons with prices
- Also provide 3 standalone suggested upsells that complement the main services
- Prices must reflect the experience level and market tier. A ${skill_level} expert in the Premium market should charge significantly more than a Beginner in the Budget market.
- Be specific and realistic — these prices should be usable by real professionals in the ${region || 'specified'} market
- The "priceLabel" field must use the correct currency symbol: ${currency.symbol} (e.g. "${currency.symbol}50,000" not "$50,000")
- Return ONLY valid JSON, no markdown, no explanation

REQUIRED JSON FORMAT:
{
  "title": "Service Title",
  "profession": "${profession}",
  "market": "${target_market}",
  "currency": "${currency.code}",
  "currencySymbol": "${currency.symbol}",
  "summary": "1-2 sentence overview of this pricing strategy",
  "packages": [
    {
      "tier": "Basic",
      "name": "Package name",
      "description": "What's included",
      "price": 000,
      "priceLabel": "${examplePrice}",
      "services": ["service 1", "service 2"],
      "addons": [
        { "name": "Add-on name", "price": 00, "priceLabel": "${currency.symbol}00" }
      ]
    }
  ],
  "upsells": [
    { "name": "Upsell name", "description": "Short description", "price": 00, "priceLabel": "${currency.symbol}00" }
  ]
}`
}
