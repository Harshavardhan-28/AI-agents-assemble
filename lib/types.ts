export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface InventoryItem {
  id: string;
  name: string;
  quantity: string;
  expiryDate?: string; // ISO string
}

export interface InventoryData {
  items: InventoryItem[];
}

export interface UserPreferences {
  skillLevel: DifficultyLevel;
  availableTimeMinutes: number;
  dietPreferences: string[];
}

export interface RecipeSuggestion {
  title: string;
  ingredients: string[];
  steps: string[];
  difficulty: DifficultyLevel;
  estimatedTimeMinutes: number;
}

export interface ShoppingListItem {
  name: string;
  quantity?: string;
  reason?: string; // e.g., "missing for recipe X"
}

export interface RecipeResponse {
  inventorySummary: string;
  recipes: RecipeSuggestion[];
  shoppingList: ShoppingListItem[];
}

export interface RecipePlanInput {
  inventory: InventoryItem[];
  skillLevel: DifficultyLevel;
  availableTimeMinutes: number;
  dietPreferences: string[];
}
