import type { RecipePlanInput, RecipeResponse } from '@/lib/types';

// TODO: Set GOOGLE_GEMINI_API_KEY in your environment for direct Gemini calls.
// In a future iteration, this module should delegate to a Kestra AI Agent
// flow instead of calling Gemini directly.

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

// Using gemini-1.5-flash for better free tier availability
const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

function buildPrompt(input: RecipePlanInput): string {
  const inventoryText = input.inventory
    .map((item) => `${item.name} (qty: ${item.quantity}${item.expiryDate ? `, expiry: ${item.expiryDate}` : ''})`)
    .join('\n');

  return `You are a smart fridge recipe assistant.

User inventory (one item per line):
${inventoryText || 'No items provided.'}

User cooking profile:
- Skill level: ${input.skillLevel}
- Available time in minutes: ${input.availableTimeMinutes}
- Dietary preferences: ${input.dietPreferences.join(', ') || 'none'}

TASK:
1. Briefly summarize what the user has, highlighting items that are expiring soon.
2. Suggest 3-5 recipes the user can cook now using primarily what they already have.
3. Produce a shopping list of missing or low-stock ingredients needed to make these recipes great.

RESPONSE FORMAT:
Return a single JSON object matching this exact TypeScript type (no extra keys):

{
  "inventorySummary": string,
  "recipes": {
    "title": string,
    "ingredients": string[],
    "steps": string[],
    "difficulty": "beginner" | "intermediate" | "advanced",
    "estimatedTimeMinutes": number
  }[],
  "shoppingList": {
    "name": string,
    "quantity"?: string,
    "reason"?: string
  }[]
}

Rules:
- Respond with JSON only, no markdown code fences or prose.
- Difficulty must be one of: "beginner", "intermediate", "advanced".
- estimatedTimeMinutes should be a reasonable integer based on the recipe.
`;
}

export async function generateRecipePlan(input: RecipePlanInput): Promise<RecipeResponse> {
  // If no API key is configured, return a simple mocked response so the UI works in hackathon demos.
  if (!GEMINI_API_KEY) {
    const inventoryNames = input.inventory.map((i) => i.name).join(', ') || 'nothing specific logged yet';
    return {
      inventorySummary: `You have ${inventoryNames}. Configure GOOGLE_GEMINI_API_KEY to get real AI suggestions.`,
      recipes: [
        {
          title: 'Mock fridge stir-fry',
          ingredients: ['Whatever veggies you have', 'Oil', 'Salt', 'Pepper', 'Soy sauce (optional)'],
          steps: [
            'Chop any vegetables that look fresh.',
            'Heat oil in a pan.',
            'Stir-fry veggies with salt and pepper for 5-7 minutes.',
            'Finish with soy sauce or any sauce you like.'
          ],
          difficulty: 'beginner',
          estimatedTimeMinutes: Math.min(input.availableTimeMinutes, 20)
        }
      ],
      shoppingList: [
        {
          name: 'Fresh vegetables',
          quantity: 'a few servings',
          reason: 'Base for quick stir-fry meals'
        }
      ]
    };
  }

  const prompt = buildPrompt(input);

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    })
  });

  if (!res.ok) {
    // eslint-disable-next-line no-console
    console.error('Gemini API error', await res.text());
    throw new Error('Failed to call Gemini API');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await res.json()) as any;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;

  if (!text) {
    throw new Error('Gemini response missing text content');
  }

  // Some models wrap JSON in markdown fences; try to strip them.
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/i);
  const jsonString = (jsonMatch ? jsonMatch[1] : text).trim();

  try {
    const parsed = JSON.parse(jsonString) as RecipeResponse;
    return parsed;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to parse Gemini JSON response', { text, error: err });
    throw new Error('Gemini did not return valid JSON in the expected shape');
  }
}
