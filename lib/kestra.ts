import type { RecipePlanInput, RecipeResponse } from '@/lib/types';

const KESTRA_AGENT_URL = process.env.KESTRA_AGENT_URL;
const KESTRA_API_TOKEN = process.env.KESTRA_API_TOKEN;
// Basic auth for Kestra 0.24+ (format: "username:password" base64 encoded)
const KESTRA_BASIC_AUTH = process.env.KESTRA_BASIC_AUTH;

/**
 * Call a Kestra AI Agent flow via Webhook trigger.
 *
 * The Kestra flow should:
 * - Have a webhook trigger with the key embedded in KESTRA_AGENT_URL
 * - Accept inputs: fridgeImage, inventory (JSON string), skillLevel, availableTimeMinutes, dietPreferences, allergies
 * - Use MultimodalCompletion to analyze fridge images when provided
 * - Return structured JSON matching RecipeResponse
 */
export async function generateRecipePlanViaKestra(input: RecipePlanInput): Promise<RecipeResponse> {
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
    dietPreferences: input.dietPreferences.join(', '),
    allergies: input.allergies?.join(', ') || ''
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

  // Check for AIAgent output structure
  if (data.outputs?.recipe_agent?.text) {
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
    result = await pollKestraExecution(data.id, headers);
  } else {
    // Fallback: try to extract from any nested structure
    console.log('[Kestra] Attempting fallback parsing...');
    result = extractRecipeResponseFromAgentText(JSON.stringify(data));
  }

  return result;
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
 * Poll Kestra for execution result (for async webhook triggers)
 */
async function pollKestraExecution(executionId: string, headers: Record<string, string>): Promise<RecipeResponse> {
  const baseUrl = KESTRA_AGENT_URL?.replace(/\/api\/v1\/.*$/, '') || 'http://localhost:8080';
  const pollUrl = `${baseUrl}/api/v1/executions/${executionId}`;
  
  // Longer timeout for AI Agent workflows (image analysis + recipe generation + validation)
  const maxAttempts = 60; // 2 minutes total
  const pollIntervalMs = 2000;

  console.log(`[Kestra] Polling execution ${executionId}...`);

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

    const res = await fetch(pollUrl, { headers });
    if (!res.ok) {
      console.warn(`[Kestra] Poll attempt ${i + 1} failed: ${res.status}`);
      continue;
    }

    const execution = await res.json();
    console.log(`[Kestra] Execution state: ${execution.state?.current}`);
    
    if (execution.state?.current === 'SUCCESS') {
      // Try to extract from various output structures
      const agentResponse = 
        execution.outputs?.format_output?.agentResponse ||
        execution.outputs?.recipe_agent?.text ||
        execution.outputs?.agentResponse;
      
      if (agentResponse) {
        return extractRecipeResponseFromAgentText(agentResponse);
      }
      
      // Fallback to raw outputs
      const output = execution.outputs?.output_result?.result;
      if (output) {
        return typeof output === 'string' ? JSON.parse(output) : output;
      }
      
      throw new Error('Kestra execution completed but no output found');
    } else if (execution.state?.current === 'FAILED') {
      console.error('[Kestra] Execution failed:', execution.state);
      throw new Error('Kestra execution failed');
    }
  }

  throw new Error('Kestra execution timed out');
}
