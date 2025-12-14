import { NextRequest, NextResponse } from 'next/server';
import { getAdminDatabase } from '@/lib/firebaseAdmin';

// This endpoint is called by Kestra to save inventory data
// It uses Firebase Admin SDK which has full access

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, inventory } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!inventory) {
      return NextResponse.json({ error: 'inventory is required' }, { status: 400 });
    }

    console.log('[API/Firebase] Saving inventory for user:', userId);
    console.log('[API/Firebase] Inventory data type:', typeof inventory);

    const db = getAdminDatabase();
    
    // Parse inventory if it's a string
    let inventoryData = inventory;
    if (typeof inventory === 'string') {
      // Strip markdown code blocks if present (```json ... ```)
      let cleanedInventory = inventory.trim();
      
      // Remove markdown code fences
      if (cleanedInventory.startsWith('```')) {
        // Remove opening fence (```json or ```)
        cleanedInventory = cleanedInventory.replace(/^```(?:json)?\s*\n?/, '');
        // Remove closing fence
        cleanedInventory = cleanedInventory.replace(/\n?```\s*$/, '');
      }
      
      try {
        inventoryData = JSON.parse(cleanedInventory.trim());
      } catch {
        // If it's not valid JSON, wrap it
        inventoryData = [{ name: cleanedInventory, quantity: '1', category: 'other' }];
      }
    }
    
    // Ensure inventoryData is an array
    if (!Array.isArray(inventoryData)) {
      inventoryData = [inventoryData];
    }

    // Save to Firebase
    await db.ref(`users/${userId}/inventory`).set(inventoryData);
    
    console.log('[API/Firebase] Inventory saved successfully');

    return NextResponse.json({ success: true, itemCount: Array.isArray(inventoryData) ? inventoryData.length : 1 });
  } catch (error) {
    console.error('[API/Firebase] Error saving inventory:', error);
    return NextResponse.json(
      { error: 'Failed to save inventory' },
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
    const snapshot = await db.ref(`users/${userId}/inventory`).once('value');
    const inventory = snapshot.val();

    return NextResponse.json(inventory || []);
  } catch (error) {
    console.error('[API/Firebase] Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}
