import { getAdminDatabase } from '@/lib/firebaseAdmin';
import type { InventoryData, InventoryItem, UserPreferences } from '@/lib/types';

const USERS_PATH = 'users';

export async function getUserInventory(uid: string): Promise<InventoryData> {
  const db = getAdminDatabase();
  const snapshot = await db.ref(`${USERS_PATH}/${uid}/inventory`).get();
  const value = snapshot.val() as InventoryData | null;
  return value ?? { items: [] };
}

export async function setUserInventory(uid: string, items: InventoryItem[]): Promise<void> {
  const db = getAdminDatabase();
  await db.ref(`${USERS_PATH}/${uid}/inventory`).set({ items });
}

export async function getUserPreferences(uid: string): Promise<UserPreferences | null> {
  const db = getAdminDatabase();
  const snapshot = await db.ref(`${USERS_PATH}/${uid}/preferences`).get();
  const value = snapshot.val() as UserPreferences | null;
  return value ?? null;
}

export async function setUserPreferences(uid: string, prefs: UserPreferences): Promise<void> {
  const db = getAdminDatabase();
  await db.ref(`${USERS_PATH}/${uid}/preferences`).set(prefs);
}
