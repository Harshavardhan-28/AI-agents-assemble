# Kestra AI Agent Integration

This document describes the **subflow architecture** for the Smart Fridge app, designed for the **Wakanda Data Award**.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SMART FRIDGE MAIN ORCHESTRATOR                   │
│                      (smart-fridge-main.yaml)                        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  SUBFLOW 1:     │     │  SUBFLOW 2:     │     │  SUBFLOW 3:     │
│  Inventory      │────▶│  Recipe         │────▶│  Shopping List  │
│  Manager        │     │  Generator      │     │  Manager        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │  AI Agent             │  AI Agent             │  AI Agent
        │  SUMMARIZES           │  GENERATES            │  DECIDES
        │  Image/Text           │  Recipes              │  What to Buy
        ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FIREBASE REALTIME DATABASE                        │
│   /users/{userId}/inventory  |  /recipes  |  /shopping_list         │
└─────────────────────────────────────────────────────────────────────┘
```

## Wakanda Data Award Criteria

### 1. Data Summarization (Flow 1: manage-inventory)
- AI Agent analyzes fridge images using **Gemini Vision**
- Extracts and normalizes food items into structured JSON
- **Summarizes** visual + text data into unified inventory format

### 2. Cross-System Reasoning (Flow 3: create-shopping-list)  
- Fetches data from **TWO Firebase endpoints** (Inventory & Recipes)
- AI Agent compares recipe requirements vs available inventory
- Makes intelligent **DECISIONS** about what needs to be purchased

### 3. Decision Making
- Validation loop regenerates recipes if dietary constraints violated
- Shopping list prioritizes items by importance and groups by store section
- Conditional execution based on AI analysis results

---

## Subflow Details

### Flow 1: `manage-inventory`
**Purpose:** Ingest images/text, extract inventory items, save to Firebase

```yaml
id: manage-inventory
namespace: ai.smartfridge

# Webhook Key: inventory-manager-webhook-key-12345

Inputs:
  - userId: string
  - fridgeImage: string (base64 or URL)
  - manualInventory: string (comma-separated or JSON)

Output: JSON array of inventory items
  [{ "name": "milk", "quantity": "1 gallon", "category": "dairy" }]

AI Agent Role: SUMMARIZE raw visual/text data into structured format
```

### Flow 2: `generate-recipes`
**Purpose:** Fetch inventory from Firebase, generate recipes based on user constraints

```yaml
id: generate-recipes
namespace: ai.smartfridge

# Webhook Key: recipe-generator-webhook-key-12345

Inputs:
  - userId: string
  - skillLevel: beginner | intermediate | advanced
  - availableTime: number (minutes)
  - dietaryRestriction: None | Vegetarian | Vegan | Keto | etc.
  - allergies: string (comma-separated)

Output: JSON object
  {
    "recipes": [...],
    "inventorySummary": "...",
    "shoppingList": [...]
  }

AI Agent Role: GENERATE content based on summarized database state
```

### Flow 3: `create-shopping-list`
**Purpose:** Compare recipes vs inventory, create smart shopping list

```yaml
id: create-shopping-list
namespace: ai.smartfridge

# Webhook Key: shopping-list-webhook-key-12345

Inputs:
  - userId: string
  - recipeFilter: string (optional - specific recipe name)

Output: JSON object
  {
    "shoppingList": [
      { "name": "...", "quantity": "...", "category": "...", "priority": "..." }
    ],
    "summary": { "totalItems": 5, "estimatedTotal": "$25.00" }
  }

AI Agent Role: DECIDE what's missing by comparing two data sources
```

### Main Orchestrator: `smart-fridge-main`
**Purpose:** Chain all subflows together for complete pipeline execution

```yaml
id: smart-fridge-main
namespace: ai.smartfridge

# Webhook Key: smartfridge-main-webhook-key-12345

Inputs: All inputs from subflows + control flags
  - runInventory: boolean (default: true)
  - runRecipes: boolean (default: true)
  - runShopping: boolean (default: true)
```

---

## Environment Variables

### Next.js App (.env.local)
```env
# Kestra Configuration
KESTRA_BASE_URL=http://localhost:8080
KESTRA_API_TOKEN=your-api-token
# OR for basic auth:
KESTRA_BASIC_AUTH=base64-encoded-username:password

# Legacy single-flow URL (deprecated)
KESTRA_AGENT_URL=http://localhost:8080/api/v1/executions/webhook/ai.smartfridge/smart-fridge-recipes/smartfridge-recipes-secret-key-12345
```

### Kestra Secrets (set in Kestra UI)
```
GEMINI_API_KEY     = Your Google AI Studio API key
FIREBASE_DB_URL    = https://your-project.firebaseio.com
```

---

## Flow Files Location

```
kestra/
├── flows/
│   ├── manage-inventory.yaml      # Subflow 1: Image/text → Inventory
│   ├── generate-recipes.yaml      # Subflow 2: Inventory → Recipes
│   ├── create-shopping-list.yaml  # Subflow 3: Recipes → Shopping List
│   └── smart-fridge-main.yaml     # Main orchestrator
└── smart-fridge-recipes.yaml      # Legacy single flow (kept for reference)
```

---

## Deploying Flows to Kestra

### Option 1: Kestra CLI
```bash
kestra flow deploy kestra/flows/ --server http://localhost:8080
```

### Option 2: Kestra UI
1. Go to http://localhost:8080
2. Navigate to Flows → Create
3. Paste YAML content for each flow
4. Save and enable

### Option 3: API
```bash
curl -X PUT http://localhost:8080/api/v1/flows \
  -H "Content-Type: application/x-yaml" \
  --data-binary @kestra/flows/manage-inventory.yaml
```

---

## Testing the Flows

### Test Inventory Manager
```bash
curl -X POST http://localhost:8080/api/v1/executions/webhook/ai.smartfridge/manage-inventory/inventory-manager-webhook-key-12345 \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "manualInventory": "milk, eggs, bread, cheese, tomatoes"
  }'
```

### Test Recipe Generator
```bash
curl -X POST http://localhost:8080/api/v1/executions/webhook/ai.smartfridge/generate-recipes/recipe-generator-webhook-key-12345 \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "skillLevel": "intermediate",
    "availableTime": 45,
    "dietaryRestriction": "None",
    "allergies": "None"
  }'
```

### Test Shopping List
```bash
curl -X POST http://localhost:8080/api/v1/executions/webhook/ai.smartfridge/create-shopping-list/shopping-list-webhook-key-12345 \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user"
  }'
```

### Test Full Pipeline
```bash
curl -X POST http://localhost:8080/api/v1/executions/webhook/ai.smartfridge/smart-fridge-main/smartfridge-main-webhook-key-12345 \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "manualInventory": "chicken, rice, broccoli, soy sauce",
    "skillLevel": "beginner",
    "availableTime": 30,
    "dietaryRestriction": "None",
    "runInventory": true,
    "runRecipes": true,
    "runShopping": true
  }'
```

---

## API Integration

The Next.js app integrates via `lib/kestra.ts`:

```typescript
// Individual subflow calls
await updateInventoryViaKestra(userId, fridgeImage, manualInventory);
await generateRecipesViaKestra(userId, skillLevel, time, diet, allergies);
await createShoppingListViaKestra(userId, recipeFilter);

// Full pipeline
await runFullPipelineViaKestra(input);

// Legacy single-flow (backward compatible)
await generateRecipePlanViaKestra(input);
```

---

## Monitoring

1. **Kestra UI**: http://localhost:8080 - View executions, logs, outputs
2. **Firebase Console**: Monitor Realtime Database writes
3. **Next.js Logs**: Check server console for `[Kestra]` prefixed logs
