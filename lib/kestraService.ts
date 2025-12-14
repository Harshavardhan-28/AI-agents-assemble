/**
 * Kestra API Service
 * Triggers Kestra flows and handles responses
 */

const KESTRA_BASE_URL = process.env.NEXT_PUBLIC_KESTRA_URL || 'http://localhost:8080';
const KESTRA_NAMESPACE = 'ai.smartfridge';

// Webhook keys for each flow
const WEBHOOK_KEYS = {
  main: 'smartfridge-main-webhook-key-12345',
  inventory: 'inventory-manager-webhook-key-12345',
  recipes: 'recipe-generator-webhook-key-12345',
  shopping: 'shopping-list-webhook-key-12345'
};

export interface KestraInputs {
  userId: string;
  fridgeImage?: string; // Base64 encoded
  manualInventory?: string;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
  availableTime?: number;
  dietaryRestriction?: string;
  allergies?: string;
  runInventory?: boolean;
  runRecipes?: boolean;
  runShopping?: boolean;
}

export interface KestraResponse {
  id: string;
  state: {
    current: string;
    startDate: string;
  };
  namespace: string;
  flowId: string;
}

/**
 * Trigger the main Smart Fridge pipeline
 * This is the primary entry point that runs all subflows
 */
export async function triggerSmartFridgePipeline(inputs: KestraInputs): Promise<KestraResponse> {
  const url = `${KESTRA_BASE_URL}/api/v1/executions/webhook/${KESTRA_NAMESPACE}/smart-fridge-main/${WEBHOOK_KEYS.main}`;
  
  console.log('[Kestra] Triggering main pipeline:', { userId: inputs.userId, hasImage: !!inputs.fridgeImage });
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: inputs.userId,
      fridgeImage: inputs.fridgeImage || '',
      manualInventory: inputs.manualInventory || '',
      skillLevel: inputs.skillLevel || 'beginner',
      availableTime: inputs.availableTime || 30,
      dietaryRestriction: inputs.dietaryRestriction || 'None',
      allergies: inputs.allergies || 'None',
      runInventory: inputs.runInventory ?? true,
      runRecipes: inputs.runRecipes ?? true,
      runShopping: inputs.runShopping ?? true
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Kestra] Pipeline trigger failed:', response.status, errorText);
    throw new Error(`Failed to trigger Kestra pipeline: ${response.status}`);
  }

  const data = await response.json();
  console.log('[Kestra] Pipeline triggered successfully:', data.id);
  return data;
}

/**
 * Trigger just the inventory manager flow
 */
export async function triggerInventoryFlow(
  userId: string, 
  fridgeImage?: string, 
  manualInventory?: string
): Promise<KestraResponse> {
  const url = `${KESTRA_BASE_URL}/api/v1/executions/webhook/${KESTRA_NAMESPACE}/manage-inventory/${WEBHOOK_KEYS.inventory}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      fridgeImage: fridgeImage || '',
      manualInventory: manualInventory || ''
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to trigger inventory flow: ${response.status}`);
  }

  return response.json();
}

/**
 * Trigger just the recipe generator flow
 */
export async function triggerRecipeFlow(
  userId: string,
  skillLevel: string,
  availableTime: number,
  dietaryRestriction: string,
  allergies: string
): Promise<KestraResponse> {
  const url = `${KESTRA_BASE_URL}/api/v1/executions/webhook/${KESTRA_NAMESPACE}/generate-recipes/${WEBHOOK_KEYS.recipes}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      skillLevel,
      availableTime,
      dietaryRestriction,
      allergies
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to trigger recipe flow: ${response.status}`);
  }

  return response.json();
}

/**
 * Trigger just the shopping list flow
 */
export async function triggerShoppingListFlow(
  userId: string,
  recipeFilter?: string
): Promise<KestraResponse> {
  const url = `${KESTRA_BASE_URL}/api/v1/executions/webhook/${KESTRA_NAMESPACE}/create-shopping-list/${WEBHOOK_KEYS.shopping}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      recipeFilter: recipeFilter || ''
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to trigger shopping list flow: ${response.status}`);
  }

  return response.json();
}

/**
 * Convert a File to Base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      // Kestra expects just the base64 string
      resolve(result);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Poll Kestra execution status
 */
export async function pollExecutionStatus(executionId: string): Promise<{
  state: string;
  outputs?: Record<string, unknown>;
}> {
  const url = `${KESTRA_BASE_URL}/api/v1/executions/${executionId}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to get execution status: ${response.status}`);
  }

  const data = await response.json();
  return {
    state: data.state?.current,
    outputs: data.outputs
  };
}
