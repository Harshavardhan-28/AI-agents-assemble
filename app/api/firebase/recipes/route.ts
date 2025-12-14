import { NextRequest, NextResponse } from 'next/server';
import { getAdminDatabase } from '@/lib/firebaseAdmin';

// This endpoint is called by Kestra to save/get recipes data
// It uses Firebase Admin SDK which has full access

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, recipes } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!recipes) {
      return NextResponse.json({ error: 'recipes is required' }, { status: 400 });
    }

    console.log('[API/Firebase] Saving recipes for user:', userId);

    const db = getAdminDatabase();
    
    // Parse recipes if it's a string
    let recipesData = recipes;
    if (typeof recipes === 'string') {
      // Strip markdown code blocks if present (```json ... ```)
      let cleanedRecipes = recipes.trim();
      
      if (cleanedRecipes.startsWith('```')) {
        cleanedRecipes = cleanedRecipes.replace(/^```(?:json)?\s*\n?/, '');
        cleanedRecipes = cleanedRecipes.replace(/\n?```\s*$/, '');
      }
      
      try {
        recipesData = JSON.parse(cleanedRecipes.trim());
      } catch {
        recipesData = { raw: cleanedRecipes };
      }
    }

    // Save to Firebase
    await db.ref(`users/${userId}/recipes`).set(recipesData);
    
    console.log('[API/Firebase] Recipes saved successfully');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API/Firebase] Error saving recipes:', error);
    return NextResponse.json(
      { error: 'Failed to save recipes' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const db = getAdminDatabase();
    const snapshot = await db.ref(`users/${userId}/recipes`).once('value');
    const recipes = snapshot.val();

    return NextResponse.json(recipes || {});
  } catch (error) {
    console.error('[API/Firebase] Error fetching recipes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}
