import { NextRequest, NextResponse } from 'next/server';
import { getAdminDatabase } from '@/lib/firebaseAdmin';

// This endpoint is called by Kestra to save/get shopping list data
// It uses Firebase Admin SDK which has full access

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, shoppingList } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!shoppingList) {
      return NextResponse.json({ error: 'shoppingList is required' }, { status: 400 });
    }

    console.log('[API/Firebase] Saving shopping list for user:', userId);

    const db = getAdminDatabase();
    
    // Parse shoppingList if it's a string
    let listData = shoppingList;
    if (typeof shoppingList === 'string') {
      // Strip markdown code blocks if present (```json ... ```)
      let cleanedList = shoppingList.trim();
      
      if (cleanedList.startsWith('```')) {
        cleanedList = cleanedList.replace(/^```(?:json)?\s*\n?/, '');
        cleanedList = cleanedList.replace(/\n?```\s*$/, '');
      }
      
      try {
        listData = JSON.parse(cleanedList.trim());
      } catch {
        listData = { raw: cleanedList };
      }
    }

    // Extract the actual list array if it's nested
    const actualList = listData?.shoppingList || listData;

    // Save to Firebase
    await db.ref(`users/${userId}/shopping_list`).set(actualList);
    
    console.log('[API/Firebase] Shopping list saved successfully');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API/Firebase] Error saving shopping list:', error);
    return NextResponse.json(
      { error: 'Failed to save shopping list' },
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
    const snapshot = await db.ref(`users/${userId}/shopping_list`).once('value');
    const shoppingList = snapshot.val();

    return NextResponse.json(shoppingList || []);
  } catch (error) {
    console.error('[API/Firebase] Error fetching shopping list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shopping list' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}
