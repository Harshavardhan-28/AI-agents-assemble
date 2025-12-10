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
 * - Accept inputs: inventory (JSON string), skillLevel, availableTimeMinutes, dietPreferences
 * - Return structured JSON matching RecipeResponse
 */
export async function generateRecipePlanViaKestra(input: RecipePlanInput): Promise<RecipeResponse> {
  if (!KESTRA_AGENT_URL) {
    throw new Error('KESTRA_AGENT_URL is not configured');
  }

  // Prepare inputs for Kestra flow
  const kestraInputs = {
    inventory: JSON.stringify(input.inventory),
    skillLevel: input.skillLevel,
    availableTimeMinutes: input.availableTimeMinutes,
    dietPreferences: input.dietPreferences.join(', ')
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

  const res = await fetch(KESTRA_AGENT_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(kestraInputs)
  });

  if (!res.ok) {
    // eslint-disable-next-line no-console
    console.error('Kestra agent HTTP error', res.status, await res.text());
    throw new Error('Failed to call Kestra agent');
  }

  // Kestra webhook returns execution metadata - we need to poll for results
  // For simplicity, if using synchronous execution or the flow returns directly:
  const data = await res.json();

  // If Kestra returns the execution object, extract the output
  // The structure depends on your Kestra setup:
  // - Synchronous: data contains the result directly
  // - Async: data contains executionId, need to poll /api/v1/executions/{id}
  
  // Try to extract result from different possible response structures
  let result: RecipeResponse;

  if (data.outputs?.output_result?.result) {
    // Flow completed with OutputValues task
    result = typeof data.outputs.output_result.result === 'string' 
      ? JSON.parse(data.outputs.output_result.result)
      : data.outputs.output_result.result;
  } else if (data.inventorySummary && data.recipes) {
    // Direct response
    result = data as RecipeResponse;
  } else if (data.id) {
    // Async execution - need to poll for result
    result = await pollKestraExecution(data.id, headers);
  } else {
    // Fallback: try to parse as RecipeResponse
    result = data as RecipeResponse;
  }

  return result;
}

/**
 * Poll Kestra for execution result (for async webhook triggers)
 */
async function pollKestraExecution(executionId: string, headers: Record<string, string>): Promise<RecipeResponse> {
  const baseUrl = KESTRA_AGENT_URL?.replace(/\/api\/v1\/.*$/, '') || 'http://localhost:8080';
  const pollUrl = `${baseUrl}/api/v1/executions/${executionId}`;
  
  const maxAttempts = 30;
  const pollIntervalMs = 2000;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

    const res = await fetch(pollUrl, { headers });
    if (!res.ok) continue;

    const execution = await res.json();
    
    if (execution.state?.current === 'SUCCESS') {
      const output = execution.outputs?.output_result?.result;
      if (output) {
        return typeof output === 'string' ? JSON.parse(output) : output;
      }
    } else if (execution.state?.current === 'FAILED') {
      throw new Error('Kestra execution failed');
    }
  }

  throw new Error('Kestra execution timed out');
}
