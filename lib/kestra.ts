import type { RecipePlanInput, RecipeResponse, InventoryItem } from '@/lib/types';

// Kestra endpoint URLs - configured in .env
const KESTRA_BASE_URL = process.env.KESTRA_BASE_URL || 'http://localhost:8080';
const KESTRA_AGENT_URL = process.env.KESTRA_AGENT_URL; // Legacy webhook URL
const KESTRA_API_TOKEN = process.env.KESTRA_API_TOKEN;
const KESTRA_BASIC_AUTH = process.env.KESTRA_BASIC_AUTH;

// Webhook keys for each subflow
const WEBHOOK_KEYS = {
  inventory: 'inventory-manager-webhook-key-12345',
  recipes: 'recipe-generator-webhook-key-12345',
  shopping: 'shopping-list-webhook-key-12345',
  main: 'smartfridge-main-webhook-key-12345'
};

/**
 * Build authorization headers for Kestra API calls
 */
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (KESTRA_API_TOKEN) {
    headers['Authorization'] = `Bearer ${KESTRA_API_TOKEN}`;
  } else if (KESTRA_BASIC_AUTH) {
    headers['Authorization'] = `Basic ${KESTRA_BASIC_AUTH}`;
  }

  return headers;
}

/**
 * Call a Kestra webhook trigger
 */
async function callKestraWebhook(
  flowId: string, 
  webhookKey: string, 
  inputs: Record<string, unknown>
): Promise<unknown> {
  const url = `${KESTRA_BASE_URL}/api/v1/executions/webhook/ai.smartfridge/${flowId}/${webhookKey}`;
  
  console.log(`[Kestra] Calling ${flowId} webhook...`);
  
  const res = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(inputs)
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[Kestra] ${flowId} HTTP error`, res.status, errorText);
    throw new Error(`Failed to call Kestra ${flowId}: ${res.status}`);
  }

  const data = await res.json();
  console.log(`[Kestra] ${flowId} response received`);
  
  // If async execution, poll for results
  if (data.id && data.state) {
    return await pollKestraExecution(data.id);
  }
  
  return data;
}

/**
 * SUBFLOW 1: Manage Inventory
 * Uses AI Agent to analyze fridge images and extract inventory items
 */
export async function updateInventoryViaKestra(
  userId: string,
  fridgeImage?: string,
  manualInventory?: string
): Promise<InventoryItem[]> {
  const inputs = {
    userId,
    fridgeImage: fridgeImage || '',
    manualInventory: manualInventory || ''
  };

  console.log('[Kestra] Updating inventory via AI Agent...');
  
  const result = await callKestraWebhook('manage-inventory', WEBHOOK_KEYS.inventory, inputs);
  
  // Extract inventory from result
  const inventory = extractInventoryFromResult(result);
  console.log(`[Kestra] Inventory updated: ${inventory.length} items`);
  
  return inventory;
}

/**
 * SUBFLOW 2: Generate Recipes
 * Fetches inventory from Firebase, generates recipes based on constraints
 */
export async function generateRecipesViaKestra(
  userId: string,
  skillLevel: string,
  availableTime: number,
  dietaryRestriction: string,
  allergies: string
): Promise<RecipeResponse> {
  const inputs = {
    userId,
    skillLevel,
    availableTime,
    dietaryRestriction,
    allergies
  };

  console.log('[Kestra] Generating recipes via AI Agent...');
  
  const result = await callKestraWebhook('generate-recipes', WEBHOOK_KEYS.recipes, inputs);
  
  return extractRecipeResponseFromResult(result);
}

/**
 * SUBFLOW 3: Create Shopping List
 * Compares inventory vs recipe requirements, generates shopping list
 */
export async function createShoppingListViaKestra(
  userId: string,
  recipeFilter?: string
): Promise<{ shoppingList: Array<{ name: string; quantity?: string; category?: string }> }> {
  const inputs = {
    userId,
    recipeFilter: recipeFilter || ''
  };

  console.log('[Kestra] Creating shopping list via AI Agent...');
  
  const result = await callKestraWebhook('create-shopping-list', WEBHOOK_KEYS.shopping, inputs);
  
  return extractShoppingListFromResult(result);
}

/**
 * MAIN ORCHESTRATOR: Full pipeline
 * Runs Inventory → Recipes → Shopping List
 */
export async function runFullPipelineViaKestra(input: RecipePlanInput & { userId: string }): Promise<RecipeResponse> {
  const inputs = {
    userId: input.userId,
    fridgeImage: input.fridgeImage || '',
    manualInventory: JSON.stringify(input.inventory),
    skillLevel: input.skillLevel,
    availableTime: input.availableTimeMinutes,
    dietaryRestriction: input.dietPreferences[0] || 'None',
    allergies: input.allergies?.join(', ') || 'None',
    runInventory: Boolean(input.fridgeImage || input.inventory.length > 0),
    runRecipes: true,
    runShopping: true
  };

  console.log('[Kestra] Running full pipeline...');
  
  const result = await callKestraWebhook('smart-fridge-main', WEBHOOK_KEYS.main, inputs);
  
  return extractRecipeResponseFromResult(result);
}

/**
 * Legacy function - maintained for backward compatibility
 * Call a Kestra AI Agent flow via Webhook trigger.
 */
export async function generateRecipePlanViaKestra(input: RecipePlanInput): Promise<RecipeResponse> {
  // If using new subflow architecture with KESTRA_BASE_URL
  if (process.env.KESTRA_BASE_URL) {
    // Use the recipes subflow directly
    const userId = 'default_user'; // In production, pass from auth
    return generateRecipesViaKestra(
      userId,
      input.skillLevel,
      input.availableTimeMinutes,
      input.dietPreferences[0] || 'None',
      input.allergies?.join(', ') || 'None'
    );
  }
  
  // Legacy: Use old single-flow webhook
  if (!KESTRA_AGENT_URL) {
    throw new Error('KESTRA_AGENT_URL is not configured');
  }

  // Prepare inputs for Kestra flow - matching the smart-fridge-recipes.yaml inputs
  const kestraInputs: Record<string, string | number> = {
    // Image input (base64 or URL) - the agent will use MultimodalCompletion to analyze this
    fridgeImage: input.fridgeImage || '',
    // Manual inventory as backup or supplement to image analysis
    inventory: JSON.stringify(input.inventory),
    skillLevel: input.skillLevel,
    availableTimeMinutes: input.availableTimeMinutes,
    // Map dietPreferences array to single dietaryRestriction (Kestra expects this field name)
    dietaryRestriction: input.dietPreferences.length > 0 ? input.dietPreferences[0] : 'None',
    allergies: input.allergies?.join(', ') || 'None'
  };

  // Build auth header (Kestra 0.24+ requires Basic Auth)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (KESTRA_API_TOKEN) {
    headers['Authorization'] = `Bearer ${KESTRA_API_TOKEN}`;
  } else if (KESTRA_BASIC_AUTH) {
    headers['Authorization'] = `Basic ${KESTRA_BASIC_AUTH}`;
  }

  console.log('[Kestra] Calling AI Agent with inputs:', {
    hasImage: Boolean(input.fridgeImage),
    imageSize: input.fridgeImage?.length || 0,
    inventoryCount: input.inventory.length,
    skillLevel: input.skillLevel,
    time: input.availableTimeMinutes,
    allergies: input.allergies
  });

  const res = await fetch(KESTRA_AGENT_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(kestraInputs)
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('[Kestra] Agent HTTP error', res.status, errorText);
    throw new Error(`Failed to call Kestra agent: ${res.status}`);
  }

  // Kestra webhook returns execution metadata - we need to poll for results
  const data = await res.json();
  console.log('[Kestra] Initial response:', JSON.stringify(data).substring(0, 500));

  // Extract result from different possible response structures
  let result: RecipeResponse;

  // Check for finalPlan output (from smart-fridge-recipes.yaml OutputValues)
  if (data.outputs?.final_output?.finalPlan) {
    const finalPlan = data.outputs.final_output.finalPlan;
    const inventoryUsed = data.outputs.final_output.inventoryUsed || '';
    result = extractRecipeResponseFromFinalPlan(finalPlan, inventoryUsed);
  } else if (data.outputs?.recipe_agent?.text) {
    // AIAgent returns text output - try to parse JSON from it
    const agentText = data.outputs.recipe_agent.text;
    result = extractRecipeResponseFromAgentText(agentText);
  } else if (data.outputs?.format_output?.agentResponse) {
    // Our format_output task
    const agentResponse = data.outputs.format_output.agentResponse;
    result = extractRecipeResponseFromAgentText(agentResponse);
  } else if (data.outputs?.agentResponse) {
    result = extractRecipeResponseFromAgentText(data.outputs.agentResponse);
  } else if (data.inventorySummary && data.recipes) {
    // Direct response
    result = data as RecipeResponse;
  } else if (data.id && data.state) {
    // Async execution - need to poll for result
    const pollResult = await pollKestraExecution(data.id, headers);
    result = extractRecipeResponseFromResult(pollResult);
  } else {
    // Fallback: try to extract from any nested structure
    console.log('[Kestra] Attempting fallback parsing...');
    result = extractRecipeResponseFromAgentText(JSON.stringify(data));
  }

  return result;
}

/**
 * Extract RecipeResponse from Kestra's finalPlan output
 * Maps the Kestra output format to our RecipeResponse type
 */
function extractRecipeResponseFromFinalPlan(finalPlan: string, inventoryUsed: string): RecipeResponse {
  console.log('[Kestra] Parsing finalPlan output:', finalPlan.substring(0, 200));
  
  try {
    // Try to parse finalPlan as JSON
    const parsed = JSON.parse(finalPlan);
    
    // Handle Kestra's output format: { pantryItemsUsed, shoppingList, recipes }
    const recipes = (parsed.recipes || []).map((r: Record<string, unknown>) => ({
      title: r.title || 'Untitled Recipe',
      ingredients: r.ingredients || [],
      steps: r.instructions || r.steps || [],
      difficulty: r.difficulty || 'beginner',
      estimatedTimeMinutes: r.estimatedTimeMinutes || r.time || 30
    }));
    
    const shoppingList = (parsed.shoppingList || []).map((item: string | Record<string, unknown>) => {
      if (typeof item === 'string') {
        return { name: item };
      }
      return { name: item.name || item, quantity: item.quantity, reason: item.reason };
    });
    
    return {
      inventorySummary: inventoryUsed || parsed.pantryItemsUsed?.join(', ') || 'Analyzed your fridge contents',
      recipes,
      shoppingList
    };
  } catch (e) {
    console.warn('[Kestra] Failed to parse finalPlan as JSON, trying extraction:', e);
    return extractRecipeResponseFromAgentText(finalPlan);
  }
}

/**
 * Extract RecipeResponse from AI Agent's text output
 * The agent may return markdown or mixed content with JSON embedded
 */
function extractRecipeResponseFromAgentText(text: string): RecipeResponse {
  // Try to find JSON in the response
  const jsonMatch = text.match(/\{[\s\S]*"inventorySummary"[\s\S]*"recipes"[\s\S]*\}/);
  
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      console.warn('[Kestra] Failed to parse extracted JSON');
    }
  }

  // Try parsing the whole thing as JSON
  try {
    const parsed = JSON.parse(text);
    if (parsed.inventorySummary && parsed.recipes) {
      return parsed;
    }
  } catch {
    // Not JSON
  }

  // Fallback: construct a response from the text
  console.log('[Kestra] Using fallback response structure');
  return {
    inventorySummary: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
    recipes: [],
    shoppingList: []
  };
}

/**
 * Extract inventory items from Kestra result
 */
function extractInventoryFromResult(result: unknown): InventoryItem[] {
  try {
    const data = result as Record<string, unknown>;
    
    // Check various output paths
    const outputs = data.outputs as Record<string, unknown> | undefined;
    const textOutput = 
      (outputs?.inventory_agent as Record<string, unknown>)?.textOutput ||
      outputs?.currentInventory ||
      data.currentInventory;
    
    if (textOutput) {
      const parsed = typeof textOutput === 'string' ? JSON.parse(textOutput) : textOutput;
      if (Array.isArray(parsed)) {
        return parsed.map((item: Record<string, unknown>, idx: number) => ({
          id: `item_${idx}`,
          name: String(item.name || item),
          quantity: String(item.quantity || '1'),
          category: String(item.category || 'other')
        }));
      }
    }
    
    return [];
  } catch (e) {
    console.warn('[Kestra] Failed to extract inventory:', e);
    return [];
  }
}

/**
 * Extract RecipeResponse from Kestra result
 */
function extractRecipeResponseFromResult(result: unknown): RecipeResponse {
  try {
    const data = result as Record<string, unknown>;
    const outputs = data.outputs as Record<string, unknown> | undefined;
    
    // Check for new subflow output structure
    const textOutput = 
      outputs?.generatedRecipes ||
      (outputs?.recipe_agent as Record<string, unknown>)?.textOutput ||
      (outputs?.final_output as Record<string, unknown>)?.recipes ||
      data.generatedRecipes;
    
    if (textOutput) {
      const parsed = typeof textOutput === 'string' ? JSON.parse(textOutput) : textOutput;
      
      // Map to RecipeResponse format
      const recipes = (parsed.recipes || []).map((r: Record<string, unknown>) => ({
        title: String(r.title || r.name || 'Untitled Recipe'),
        ingredients: Array.isArray(r.ingredients) ? r.ingredients.map(String) : [],
        steps: Array.isArray(r.steps) ? r.steps.map(String) : (Array.isArray(r.instructions) ? r.instructions.map(String) : []),
        difficulty: String(r.difficulty || 'easy'),
        estimatedTimeMinutes: Number(r.estimatedTimeMinutes || r.time || 30)
      }));
      
      const shoppingList = (parsed.shoppingList || []).map((item: Record<string, unknown> | string) => {
        if (typeof item === 'string') return { name: item };
        return { 
          name: String(item.name || item), 
          quantity: item.quantity ? String(item.quantity) : undefined 
        };
      });
      
      return {
        inventorySummary: String(parsed.inventorySummary || 'Analyzed your ingredients'),
        recipes,
        shoppingList
      };
    }
    
    // Fallback to legacy parsing
    return extractRecipeResponseFromAgentText(JSON.stringify(result));
  } catch (e) {
    console.warn('[Kestra] Failed to extract recipes:', e);
    return { inventorySummary: 'Error parsing results', recipes: [], shoppingList: [] };
  }
}

/**
 * Extract shopping list from Kestra result
 */
function extractShoppingListFromResult(result: unknown): { shoppingList: Array<{ name: string; quantity?: string; category?: string }> } {
  try {
    const data = result as Record<string, unknown>;
    const outputs = data.outputs as Record<string, unknown> | undefined;
    
    const textOutput = 
      outputs?.shoppingList ||
      (outputs?.shopping_agent as Record<string, unknown>)?.textOutput ||
      data.shoppingList;
    
    if (textOutput) {
      const parsed = typeof textOutput === 'string' ? JSON.parse(textOutput) : textOutput;
      
      if (parsed.shoppingList) {
        return {
          shoppingList: parsed.shoppingList.map((item: Record<string, unknown> | string) => {
            if (typeof item === 'string') return { name: item };
            return {
              name: String(item.name || item),
              quantity: item.quantity ? String(item.quantity) : undefined,
              category: item.category ? String(item.category) : undefined
            };
          })
        };
      }
    }
    
    return { shoppingList: [] };
  } catch (e) {
    console.warn('[Kestra] Failed to extract shopping list:', e);
    return { shoppingList: [] };
  }
}

/**
 * Poll Kestra for execution result (for async webhook triggers)
 */
async function pollKestraExecution(executionId: string, headers?: Record<string, string>): Promise<unknown> {
  const baseUrl = KESTRA_BASE_URL || KESTRA_AGENT_URL?.replace(/\/api\/v1\/.*$/, '') || 'http://localhost:8080';
  const pollUrl = `${baseUrl}/api/v1/executions/${executionId}`;
  const authHeaders = headers || getAuthHeaders();
  
  // Longer timeout for AI Agent workflows (image analysis + recipe generation + validation)
  const maxAttempts = 60; // 2 minutes total
  const pollIntervalMs = 2000;

  console.log(`[Kestra] Polling execution ${executionId}...`);

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

    const res = await fetch(pollUrl, { headers: authHeaders });
    if (!res.ok) {
      console.warn(`[Kestra] Poll attempt ${i + 1} failed: ${res.status}`);
      continue;
    }

    const execution = await res.json();
    console.log(`[Kestra] Execution state: ${execution.state?.current}`);
    
    if (execution.state?.current === 'SUCCESS') {
      return execution;
    } else if (execution.state?.current === 'FAILED') {
      console.error('[Kestra] Execution failed:', execution.state);
      throw new Error('Kestra execution failed');
    }
  }

  throw new Error('Kestra execution timed out');
}

