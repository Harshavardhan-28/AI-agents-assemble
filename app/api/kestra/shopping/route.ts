import { NextRequest, NextResponse } from 'next/server';

const KESTRA_BASE_URL = process.env.KESTRA_URL || 'http://localhost:8080';
const KESTRA_NAMESPACE = 'ai.smartfridge';
const WEBHOOK_KEY = 'shopping-list-webhook-key-12345';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, recipeFilter } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const url = `${KESTRA_BASE_URL}/api/v1/main/executions/webhook/${KESTRA_NAMESPACE}/create-shopping-list/${WEBHOOK_KEY}`;

    console.log('[API/Kestra] Triggering shopping list flow for user:', userId);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        recipeFilter: recipeFilter || ''
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API/Kestra] Shopping list flow failed:', response.status, errorText);
      return NextResponse.json(
        { error: `Kestra error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[API/Kestra] Shopping list flow triggered:', data.id);

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API/Kestra] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
