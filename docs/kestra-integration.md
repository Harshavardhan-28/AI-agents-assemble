# Kestra Integration Plan

This Next.js app currently calls Gemini directly from the `/api/recipes` route via `lib/gemini.ts`. The long-term goal is to delegate recipe planning to a **Kestra AI Agent** flow so that orchestration, logging, retries, and multi-tool reasoning are handled by Kestra.

## High-level design

- The app will call a Kestra flow via HTTP (either a webhook-triggered flow or the Executions API).
- The flow will:
  - Accept the user's inventory and cooking preferences as inputs.
  - Use an `AIAgent` task with Gemini (or another provider) to:
    - Summarize the inventory.
    - Generate recipes the user can cook now.
    - Produce a shopping list of missing ingredients.
  - Return a JSON payload matching the `RecipeResponse` shape used in this app.
- The `/api/recipes` route will be updated to:
  - POST inventory + preferences to the Kestra flow endpoint.
  - Wait for the flow's response (or poll the execution if using the Executions API).
  - Forward the resulting JSON back to the frontend.

## Example Kestra flow with AIAgent

Below is a minimal example of what a Kestra flow could look like. It assumes the Kestra installation has the AI plugins and Gemini credentials configured.

```yaml
id: smart-fridge-recipes
namespace: ai.smartfridge

inputs:
  - id: inventory
    type: JSON
    description: "Array of inventory items with name, quantity, expiryDate."
  - id: skillLevel
    type: STRING
    description: "beginner | intermediate | advanced"
  - id: availableTimeMinutes
    type: INT
  - id: dietPreferences
    type: JSON
    description: "Array of dietary preference strings."

tasks:
  - id: plan
    type: io.kestra.plugin.ai.agents.AIAgent
    description: Generate recipes and shopping list from fridge inventory.
    model:
      provider: GOOGLE
      model: gemini-1.5-flash
    # You can also configure tools, memory, etc. here.
    prompt: |
      You are a smart fridge recipe assistant.

      User inventory (JSON):
      {{ inputs.inventory | toJson }}

      User cooking profile:
      - Skill level: {{ inputs.skillLevel }}
      - Available time (minutes): {{ inputs.availableTimeMinutes }}
      - Dietary preferences: {{ inputs.dietPreferences | toJson }}

      TASK:
      1. Summarize what the user has, highlighting items that are expiring soon.
      2. Suggest 3-5 recipes the user can cook now using primarily what they already have.
      3. Generate a shopping list of missing or low-stock ingredients.

      RESPONSE FORMAT:
      Return a single JSON object with this exact structure (no extra keys):

      {
        "inventorySummary": string,
        "recipes": [
          {
            "title": string,
            "ingredients": string[],
            "steps": string[],
            "difficulty": "beginner" | "intermediate" | "advanced",
            "estimatedTimeMinutes": number
          }
        ],
        "shoppingList": [
          {
            "name": string,
            "quantity"?: string,
            "reason"?: string
          }
        ]
      }

      Rules:
      - Respond with JSON only, no markdown code fences.
      - Difficulty must be one of: "beginner", "intermediate", "advanced".
      - estimatedTimeMinutes should be a reasonable integer.

    
    expectedOutputType: JSON

  - id: finalize
    type: io.kestra.plugin.core.log.Log
    message: "Generated recipe plan: {{ taskrun.outputs.plan | toJson }}"
```

In this flow:

- The `inputs` block matches the data the Next.js app will send.
- The `AIAgent` task builds the same style of prompt as `lib/gemini.ts` but runs inside Kestra.
- `expectedOutputType: JSON` tells Kestra to validate and expose the JSON output.

## Current `/api/recipes` flow call

The Next.js API route now prefers Kestra when `KESTRA_AGENT_URL` is set:

1. Verify Firebase ID token to get `uid`.
2. Load inventory and preferences from Realtime Database (or body overrides).
3. Build a `RecipePlanInput` object.
4. If `KESTRA_AGENT_URL` is defined, call `generateRecipePlanViaKestra(input)` from `lib/kestra.ts`:

   ```ts
   const res = await fetch(process.env.KESTRA_AGENT_URL!, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KESTRA_API_TOKEN}` },
     body: JSON.stringify(input)
   });
   ```

   The Kestra flow should return a `RecipeResponse` JSON body, which is forwarded to the frontend.

5. If `KESTRA_AGENT_URL` is not set, the route falls back to calling Gemini directly via `lib/gemini.ts`.

You can explore and refine this flow using the official Kestra docs, blueprints, and examples:

- https://kestra.io/docs
- https://kestra.io/blogs/introducing-ai-agents
- https://kestra.io/blueprints?page=1&size=24&tags=ai
- https://kestra.io/tutorial-videos/all
```