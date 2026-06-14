import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'
export const maxDuration = 30

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const PROMPT = `You are an expert nutritionist and dietitian. Analyze this food image and return ONLY a JSON object with no markdown, no extra text.

{
  "detected_foods": [
    { "name": "food name", "portion": "estimated portion e.g. 1 cup, 200g", "confidence": <0-100> }
  ],
  "total_nutrition": {
    "calories": <number>,
    "protein_g": <number>,
    "carbs_g": <number>,
    "fat_g": <number>,
    "fiber_g": <number>,
    "sugar_g": <number>,
    "sodium_mg": <number>
  },
  "nutrition_per_food": [
    { "name": "food name", "calories": <number>, "protein_g": <number>, "carbs_g": <number>, "fat_g": <number> }
  ],
  "health_score": <integer 1-10>,
  "health_score_reason": "one sentence why this score",
  "diet_compatibility": {
    "keto": { "compatible": <boolean>, "reason": "short reason" },
    "vegan": { "compatible": <boolean>, "reason": "short reason" },
    "vegetarian": { "compatible": <boolean>, "reason": "short reason" },
    "low_carb": { "compatible": <boolean>, "reason": "short reason" },
    "high_protein": { "compatible": <boolean>, "reason": "short reason" },
    "mediterranean": { "compatible": <boolean>, "reason": "short reason" }
  },
  "benefits": ["health benefit 1", "health benefit 2", "health benefit 3"],
  "warnings": ["warning or concern 1 if any"],
  "suggestions": ["improvement suggestion 1", "improvement suggestion 2"],
  "meal_type": "breakfast|lunch|dinner|snack",
  "cuisine": "detected cuisine type e.g. Indonesian, Italian, etc."
}

Be accurate with nutrition estimates based on visible portion sizes. If the image is not food, set detected_foods to [] and health_score to 0.`

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('image') as File

    if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic'

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      PROMPT,
    ])

    const raw = result.response.text()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Invalid response from AI model')

    const data = JSON.parse(jsonMatch[0])

    if (!data.detected_foods || data.detected_foods.length === 0) {
      return NextResponse.json({ error: 'No food detected in the image. Please take a clearer photo of your meal.' }, { status: 422 })
    }

    return NextResponse.json({ ok: true, result: data })
  } catch (err: unknown) {
    console.error(err)
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('API key') || msg.includes('401')) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is invalid.' }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
