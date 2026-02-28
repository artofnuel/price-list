import { GoogleGenerativeAI } from '@google/generative-ai'
import { buildPrompt } from '@/lib/promptBuilder'
import { parseGeneratedList } from '@/lib/parseGeneratedList'

export async function POST(request) {
  try {
    const { profile, services } = await request.json()

    if (!profile) {
      return Response.json({ error: 'Profile is required' }, { status: 400 })
    }

    const apiToken = process.env.GEMINI_API_TOKEN
    if (!apiToken) {
      return Response.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiToken)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = buildPrompt(profile, services || [])
    const result = await model.generateContent(prompt)
    const rawText = result.response.text()

    const parsed = parseGeneratedList(rawText)

    if (!parsed) {
      return Response.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 422 }
      )
    }

    return Response.json({ data: parsed })
  } catch (err) {
    console.error('Generation error:', err)
    return Response.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
