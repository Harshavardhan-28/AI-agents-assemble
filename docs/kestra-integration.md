# Kestra Integration Plan

This Next.js app integrates with a **Kestra AI Agent** flow that orchestrates multi-step recipe planning with image analysis, validation, and decision-making.

## Architecture Overview

```
┌─────────────────────┐     ┌─────────────────────────────────────────────┐
│   Next.js Frontend  │     │            Kestra AI Agent                  │
│                     │     │                                             │
│  ┌───────────────┐  │     │  ┌─────────────────────────────────────┐   │
│  │ FridgeImage   │──┼─────┼─▶│ analyze_fridge_image (Tool 0)       │   │
│  │ Uploader      │  │     │  │ - MultimodalCompletion              │   │
│  └───────────────┘  │     │  │ - Gemini Vision                     │   │
│                     │     │  └──────────────┬──────────────────────┘   │
│  ┌───────────────┐  │     │                 │                          │
│  │ Inventory     │──┼─────┼─▶│ ┌─────────────▼──────────────────────┐   │
│  │ Manager       │  │     │  │ generate_recipes (Tool 1)           │   │
│  └───────────────┘  │     │  │ - ChatCompletion                    │   │
│                     │     │  └──────────────┬──────────────────────┘   │
│  ┌───────────────┐  │     │                 │                          │
│  │ Preferences   │──┼─────┼─▶│ ┌─────────────▼──────────────────────┐   │
│  │ Form          │  │     │  │ validate_recipes (Tool 2)           │   │
│  └───────────────┘  │     │  │ - Allergy/Time/Skill checks         │   │
│                     │     │  └──────────────┬──────────────────────┘   │
│  ┌───────────────┐  │     │                 │ Decision Point           │
│  │ Allergies     │──┼─────┼─▶│               ▼                          │
│  │ Input         │  │     │  │ If violations → regenerate_recipes   │   │
│  └───────────────┘  │     │  │ (Tool 3)                             │   │
└─────────────────────┘     └─────────────────────────────────────────────┘
```

## Hackathon Requirements Met

✅ **Uses Kestra's built-in AI Agent** (`io.kestra.plugin.ai.agent.AIAgent`)
✅ **Summarizes data from other systems** (fridge image → identified inventory)
✅ **Makes decisions based on summarized data** (validation → regeneration loop)

## Flow Structure

The Kestra flow (`kestra/smart-fridge-recipes.yaml`) contains 4 flows in a multi-document YAML:

1. **`smart-fridge-recipes`** - Main AIAgent flow with tools
2. **`analyze-image-tool`** - MultimodalCompletion for Gemini Vision
3. **`generate-recipes-tool`** - Recipe generation
4. **`validate-recipes-tool`** - Constraint validation
5. **`regenerate-recipes-tool`** - Fix violations

## Setup Instructions

### 1. Start Kestra

```bash
docker run --pull=always --rm -it -p 8080:8080 --user=root \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /tmp:/tmp kestra/kestra:latest server local
```

### 2. Configure Kestra

1. Open http://localhost:8080 and create your user
2. Go to **Settings → Secrets** and add `GEMINI_API_KEY` with your API key
3. Go to **Flows → Create** and paste the entire `kestra/smart-fridge-recipes.yaml`
4. Save the flow - Kestra will create all 4 flows

### 3. Get the Webhook URL

1. Go to the `smart-fridge-recipes` flow
2. Click the **Triggers** tab
3. Copy the webhook URL (looks like: `http://localhost:8080/api/v1/executions/webhook/ai.smartfridge/smart-fridge-recipes/smartfridge-recipes-secret-key-12345`)

### 4. Configure Next.js

Add to `.env.local`:

```env
# Kestra AI Agent Webhook URL
KESTRA_AGENT_URL=http://localhost:8080/api/v1/executions/webhook/ai.smartfridge/smart-fridge-recipes/smartfridge-recipes-secret-key-12345

# Optional: Basic Auth for Kestra (base64 encode "username:password")
KESTRA_BASIC_AUTH=YWRtaW46YWRtaW4=
```

## Frontend Integration

### Image Upload Flow

```tsx
// FridgeImageUploader.tsx
// 1. User selects image
// 2. Image is converted to base64 (with compression if needed)
// 3. base64 string is passed to parent via onImageChange callback
// 4. Dashboard stores the base64 in state

<FridgeImageUploader onImageChange={(base64) => setFridgeImage(base64)} />
```

### API Call Flow

```typescript
// Dashboard sends to /api/recipes
const requestBody = {
  fridgeImage: base64Image,  // For Kestra's analyze_fridge_image tool
  allergies: ['peanuts', 'shellfish'],
  // inventory, skillLevel, etc. loaded from Firebase
};

// API route (app/api/recipes/route.ts)
// - Builds RecipePlanInput with image
// - Calls generateRecipePlanViaKestra(input)
// - Returns RecipeResponse to frontend
```

### Kestra Integration (lib/kestra.ts)

```typescript
// Sends to Kestra webhook:
{
  fridgeImage: "data:image/jpeg;base64,/9j/4AAQ...",
  inventory: "[]",  // JSON string
  skillLevel: "beginner",
  availableTimeMinutes: 30,
  dietPreferences: "vegetarian",
  allergies: "peanuts, shellfish"
}

// Kestra AIAgent workflow:
// 1. analyze_fridge_image → identifies ingredients from image
// 2. generate_recipes → creates recipes using identified + manual inventory
// 3. validate_recipes → checks allergies, time, skill, diet
// 4. regenerate_recipes → fixes any violations (decision-making!)
// 5. Returns final validated recipes
```

## Image Input Support

The `analyze-image-tool` flow uses `io.kestra.plugin.gemini.MultimodalCompletion`:

```yaml
- id: analyze
  type: io.kestra.plugin.gemini.MultimodalCompletion
  apiKey: "{{ secret('GEMINI_API_KEY') }}"
  model: gemini-2.5-flash
  contents:
    - type: TEXT
      content: "Analyze this fridge image..."
    - type: IMAGE
      content: "{{ inputs.imageData }}"  # Base64 or URL
```

Supported image formats:
- **Base64 Data URL**: `data:image/jpeg;base64,/9j/4AAQ...`
- **Public URL**: `https://example.com/image.jpg`
- **Kestra Storage URI**: `kestra:///namespace/path/image.jpg`

## Response Structure

The Kestra agent returns:

```typescript
interface RecipeResponse {
  inventorySummary: string;  // AI summary of fridge contents
  recipes: {
    title: string;
    ingredients: string[];
    steps: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTimeMinutes: number;
    usesExpiringItems?: string[];  // Items prioritized
  }[];
  shoppingList: {
    name: string;
    quantity?: string;
    reason?: string;
  }[];
}
```

## Resources

- [Kestra Documentation](https://kestra.io/docs)
- [Kestra AI Agent Plugin](https://kestra.io/plugins/plugin-ai/agent)
- [Kestra AI Blueprints](https://kestra.io/blueprints?page=1&size=24&tags=ai)
- [Introducing AI Agents Blog](https://kestra.io/blogs/introducing-ai-agents)
- [Gemini MultimodalCompletion](https://kestra.io/plugins/plugin-gemini/io.kestra.plugin.gemini.MultimodalCompletion)
```