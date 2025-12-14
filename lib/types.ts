export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface InventoryItem {
  id?: string;
  name: string;
  quantity: string;
  category?: string;
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
  allergies?: string[];
  fridgeImage?: string; // Base64-encoded image or URL
}

// Response from image analysis (from Kestra agent)
export interface IdentifiedItem {
  name: string;
  quantity: string;
  unit: string;
  category: 'produce' | 'dairy' | 'meat' | 'seafood' | 'grains' | 'condiments' | 'beverages' | 'frozen' | 'other';
  freshness: 'fresh' | 'good' | 'expiring-soon' | 'expired' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
}

export interface ImageAnalysisResult {
  identifiedItems: IdentifiedItem[];
  summary: string;
  expiringItems: string[];
  totalItemsFound: number;
}
