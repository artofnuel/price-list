/**
 * Safely parses and validates the AI JSON response.
 * @param {string} rawText - Raw text from Gemini
 * @returns {Object|null} - Parsed price list or null
 */
export function parseGeneratedList(rawText) {
  try {
    // Strip any markdown code fences if present
    const cleaned = rawText
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/g, '')
      .trim()

    const parsed = JSON.parse(cleaned)

    // Basic validation
    if (!parsed.packages || !Array.isArray(parsed.packages)) {
      throw new Error('Missing packages array')
    }
    if (!parsed.upsells || !Array.isArray(parsed.upsells)) {
      parsed.upsells = []
    }
    if (!parsed.title) {
      parsed.title = `${parsed.profession || 'Professional'} Price List`
    }

    return parsed
  } catch (err) {
    console.error('Failed to parse AI response:', err)
    return null
  }
}
