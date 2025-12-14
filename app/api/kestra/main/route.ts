import { NextRequest, NextResponse } from 'next/server';

const KESTRA_BASE_URL = process.env.KESTRA_URL || 'http://localhost:8080';
const KESTRA_NAMESPACE = 'ai.smartfridge';
const WEBHOOK_KEY = 'smartfridge-main-webhook-key-12345';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      fridgeImage,
      manualInventory,
      skillLevel,
      availableTime,
      dietaryRestriction,
      allergies,
      runInventory,
      runRecipes,
      runShopping
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const url = `${KESTRA_BASE_URL}/api/v1/main/executions/webhook/${KESTRA_NAMESPACE}/smart-fridge-main/${WEBHOOK_KEY}`;

    console.log('[API/Kestra] Triggering main pipeline for user:', userId);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        fridgeImage: fridgeImage || '',
        manualInventory: manualInventory || '',
        skillLevel: skillLevel || 'beginner',
        availableTime: availableTime || 30,
        dietaryRestriction: dietaryRestriction || 'None',
        allergies: allergies || 'None',
        runInventory: runInventory ?? true,
        runRecipes: runRecipes ?? true,
        runShopping: runShopping ?? true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API/Kestra] Main pipeline failed:', response.status, errorText);
      return NextResponse.json(
        { error: `Kestra error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[API/Kestra] Main pipeline triggered:', data.id);

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API/Kestra] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
