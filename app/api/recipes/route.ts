import { NextRequest, NextResponse } from 'next/server';
import { verifyIdTokenFromHeader } from '@/lib/firebaseAdmin';
import { getUserInventory, getUserPreferences } from '@/lib/db';
import { generateRecipePlan } from '@/lib/gemini';
import { generateRecipePlanViaKestra } from '@/lib/kestra';
import type { DifficultyLevel, InventoryItem, RecipePlanInput, RecipeResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  const decoded = await verifyIdTokenFromHeader(request.headers.get('authorization'));
  if (!decoded) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const uid = decoded.uid;

  let body: Partial<RecipePlanInput> = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // Extract image if provided (base64 encoded)
  const fridgeImage = body.fridgeImage;

  let inventory: InventoryItem[] | undefined = body.inventory;

  if (!inventory) {
    const stored = await getUserInventory(uid);
    inventory = stored.items;
  }

  let skillLevel: DifficultyLevel | undefined = body.skillLevel;
  let availableTimeMinutes: number | undefined = body.availableTimeMinutes;
  let dietPreferences: string[] | undefined = body.dietPreferences;
  let allergies: string[] | undefined = body.allergies;

  if (!skillLevel || !availableTimeMinutes || !dietPreferences) {
    const prefs = await getUserPreferences(uid);
    if (prefs) {
      if (!skillLevel) skillLevel = prefs.skillLevel;
      if (!availableTimeMinutes) availableTimeMinutes = prefs.availableTimeMinutes;
      if (!dietPreferences) dietPreferences = prefs.dietPreferences;
    }
  }

  skillLevel = skillLevel ?? 'beginner';
  availableTimeMinutes = availableTimeMinutes ?? 30;
  dietPreferences = dietPreferences ?? [];
  allergies = allergies ?? [];

  const input: RecipePlanInput = {
    inventory: inventory ?? [],
    skillLevel,
    availableTimeMinutes,
    dietPreferences,
    allergies,
    fridgeImage // Pass the base64 image to Kestra
  };

  try {
    // Use Kestra when configured, especially for image analysis
    const useKestra = Boolean(process.env.KESTRA_AGENT_URL);
    
    // Log what we're doing
    console.log(`[API] Generating recipes via ${useKestra ? 'Kestra AI Agent' : 'Direct Gemini'}`);
    console.log(`[API] Has image: ${Boolean(fridgeImage)}, Inventory items: ${input.inventory.length}`);
    
    const plan: RecipeResponse = useKestra
      ? await generateRecipePlanViaKestra(input)
      : await generateRecipePlan(input);
    
    return NextResponse.json(plan);
  } catch (err) {
    console.error('Error generating recipe plan', err);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to generate recipes',
        details: err instanceof Error ? err.message : 'Unknown error'
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
