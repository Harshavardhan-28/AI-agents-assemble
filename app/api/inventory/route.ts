import { NextRequest, NextResponse } from 'next/server';
import { verifyIdTokenFromHeader } from '@/lib/firebaseAdmin';
import { getUserInventory, setUserInventory } from '@/lib/db';
import type { InventoryItem } from '@/lib/types';

export async function GET(request: NextRequest) {
  const decoded = await verifyIdTokenFromHeader(request.headers.get('authorization'));
  if (!decoded) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const uid = decoded.uid;
  const inventory = await getUserInventory(uid);
  return NextResponse.json(inventory);
}

export async function POST(request: NextRequest) {
  const decoded = await verifyIdTokenFromHeader(request.headers.get('authorization'));
  if (!decoded) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const uid = decoded.uid;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new NextResponse('Invalid JSON body', { status: 400 });
  }

  let items: InventoryItem[] | undefined;

  if (Array.isArray(body)) {
    items = body as InventoryItem[];
  } else if (typeof body === 'object' && body !== null && 'items' in body) {
    items = (body as { items: InventoryItem[] }).items;
  }

  if (!items) {
    return new NextResponse('Body must be an array of items or { items: [...] }', { status: 400 });
  }

  await setUserInventory(uid, items);

  return NextResponse.json({ items });
}
