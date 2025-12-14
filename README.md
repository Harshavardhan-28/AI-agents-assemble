# 🍳 Smart Fridge Recipes

> **Transform your kitchen into an AI-powered culinary hub.**

A real-time web application that scans your fridge, tracks inventory, generates personalized AI-powered recipes, and creates intelligent shopping lists—all orchestrated through Kestra workflows.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime%20DB-orange?logo=firebase)](https://firebase.google.com/)
[![Kestra](https://img.shields.io/badge/Kestra-Orchestration-5C4EE5)](https://kestra.io/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-blue?logo=google)](https://ai.google.dev/)

---

## 📋 Table of Contents

- [Why This App?](#-why-this-app)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Kestra Workflows](#-kestra-workflows-deep-dive)
- [Getting Started](#-getting-started)
- [Running Kestra Workflows](#-running-kestra-workflows)
- [API Endpoints](#-api-endpoints)
- [Future Roadmap](#-future-roadmap)
- [Learning & Growth](#-learning--growth)

---

## 🎯 Why This App?

### The Problem

Every household faces the same daily dilemma:

- 🤔 **"What's in my fridge?"** – Forgetting what you have leads to food waste
- 🍝 **"What can I cook?"** – Decision fatigue when planning meals
- 🛒 **"What do I need to buy?"** – Inefficient grocery trips, buying duplicates
- ⏰ **"I don't have time!"** – Busy lives make meal planning feel overwhelming

### The Solution

**Smart Fridge Recipes** automates your entire kitchen workflow:

1. **📷 Snap** – Take a photo of your fridge
2. **🤖 Analyze** – AI identifies all ingredients automatically
3. **👨‍🍳 Generate** – Get personalized recipes based on what you have
4. **🛒 Shop** – Receive a smart shopping list for missing items

All powered by **event-driven automation** that works in real-time!

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🧊 **Smart Inventory** | AI-powered image recognition identifies fridge contents |
| 🍳 **Recipe Generation** | Personalized recipes based on skill level, time & dietary needs |
| 📝 **Shopping Lists** | Intelligent gap analysis between inventory and recipes |
| 🔄 **Real-time Sync** | Firebase-powered instant updates across devices |
| ⚡ **Workflow Automation** | Kestra orchestrates the entire pipeline |
| 🔐 **Secure Auth** | Google authentication via Firebase |

---

## 🛠 Tech Stack

### Frontend
- **Next.js 14** – React framework with App Router
- **Tailwind CSS** – Utility-first styling
- **Framer Motion** – Smooth animations
- **TypeScript** – Type-safe development

### Backend & Data
- **Firebase Realtime Database** – Real-time data synchronization
- **Firebase Auth** – Google authentication
- **Next.js API Routes** – Serverless backend endpoints

### AI & Orchestration
- **Kestra** – Workflow orchestration platform
- **Google Gemini 2.5 Flash** – Vision & language AI models
- **AI Agents** – Intelligent task execution

### Deployment
- **Vercel** – Frontend hosting with edge functions
- **Kestra Cloud / Docker** – Workflow execution

---

## 🏗 Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                  │
│                         (Next.js 14 + Tailwind)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│   │   /live     │    │  /inventory │    │  /recipes   │    │  /shopping  │ │
│   │   (Home)    │───▶│   (Scan)    │───▶│  (Generate) │───▶│   (List)    │ │
│   └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘ │
│                              │                 │                 │          │
└──────────────────────────────┼─────────────────┼─────────────────┼──────────┘
                               │                 │                 │
                               ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NEXT.JS API ROUTES                                │
│                                                                             │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│   │ /api/kestra/    │  │ /api/firebase/  │  │ /api/recipes    │            │
│   │ inventory       │  │ inventory       │  │                 │            │
│   │ recipes         │  │ recipes         │  │                 │            │
│   │ shopping        │  │ shopping        │  │                 │            │
│   └────────┬────────┘  └────────┬────────┘  └─────────────────┘            │
│            │                    │                                           │
└────────────┼────────────────────┼───────────────────────────────────────────┘
             │                    │
             ▼                    ▼
┌─────────────────────┐  ┌─────────────────────┐
│                     │  │                     │
│   KESTRA CLOUD      │  │  FIREBASE REALTIME  │
│   ════════════      │  │  DATABASE           │
│                     │  │  ═══════════════    │
│ ┌─────────────────┐ │  │                     │
│ │ smart-fridge-   │ │  │  users/             │
│ │ main            │ │  │   └── {userId}/     │
│ │ (Orchestrator)  │ │  │       ├── inventory │
│ │       │         │ │  │       ├── recipes   │
│ │       ▼         │ │  │       └── shopping  │
│ │ ┌───────────┐   │ │  │                     │
│ │ │ manage-   │   │◀┼──┼─────────────────────│
│ │ │ inventory │   │ │  │                     │
│ │ └─────┬─────┘   │ │  │                     │
│ │       ▼         │ │  │                     │
│ │ ┌───────────┐   │ │  │                     │
│ │ │ generate- │   │─┼──┼────────────────────▶│
│ │ │ recipes   │   │ │  │                     │
│ │ └─────┬─────┘   │ │  │                     │
│ │       ▼         │ │  │                     │
│ │ ┌───────────┐   │ │  │                     │
│ │ │ create-   │   │─┼──┼────────────────────▶│
│ │ │ shopping  │   │ │  │                     │
│ │ └───────────┘   │ │  │                     │
│ └─────────────────┘ │  │                     │
│         │           │  │                     │
│         ▼           │  │                     │
│   GEMINI 2.5 FLASH  │  │                     │
│   (AI Processing)   │  │                     │
│                     │  │                     │
└─────────────────────┘  └─────────────────────┘
```

### Data Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Upload  │────▶│ Analyze  │────▶│ Generate │────▶│  Create  │
│  Image   │     │ Contents │     │ Recipes  │     │ Shopping │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │
     ▼                ▼                ▼                ▼
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Base64   │     │ JSON     │     │ Recipe   │     │ Shopping │
│ Encoding │     │ Inventory│     │ Array    │     │ List     │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │                │                │
                      └────────────────┴────────────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │    Firebase     │
                              │ Realtime Update │
                              └─────────────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │   UI Reflects   │
                              │    Instantly    │
                              └─────────────────┘
```

---

## 🔄 Kestra Workflows Deep Dive

Our application uses **Kestra** for intelligent workflow orchestration. Here's how each flow works:

### 🎯 Main Orchestrator: `smart-fridge-main`

**Purpose:** Master controller that chains all subflows together.

```
┌─────────────────────────────────────────────────────────────┐
│                    smart-fridge-main                        │
│                    (Master Orchestrator)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  INPUTS:                                                    │
│  ├── userId: string                                         │
│  ├── fridgeImage: base64/URL                               │
│  ├── skillLevel: beginner|intermediate|advanced            │
│  ├── availableTime: minutes                                │
│  ├── dietaryRestriction: Vegetarian|Vegan|Keto|...        │
│  └── allergies: string                                     │
│                                                             │
│  CONDITIONAL EXECUTION:                                     │
│  ┌─────────────────┐                                       │
│  │ runInventory?   │──Yes──▶ manage-inventory              │
│  └─────────────────┘                                       │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                       │
│  │ runRecipes?     │──Yes──▶ generate-recipes              │
│  └─────────────────┘                                       │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                       │
│  │ runShopping?    │──Yes──▶ create-shopping-list          │
│  └─────────────────┘                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 🧊 Subflow 1: `manage-inventory`

**Purpose:** AI-powered inventory extraction from fridge images.

**Wakanda Data Award Goal:** Agent **SUMMARIZES** visual/text data into structured format.

```
┌─────────────────────────────────────────────────────────────┐
│                    manage-inventory                         │
│              (Vision AI + Data Extraction)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  INPUT: Fridge image (URL, Base64, or Data URI)            │
│                                                             │
│  ┌─────────────────┐                                       │
│  │ Step 0: Prepare │  Normalize image format               │
│  │ Image           │  (URL → bytes, Base64 → bytes)        │
│  └────────┬────────┘                                       │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                       │
│  │ Step 1: Vision  │  Gemini 2.5 Flash analyzes image      │
│  │ Analysis        │  Outputs: plain text list of items    │
│  └────────┬────────┘                                       │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                       │
│  │ Step 2: AI      │  Converts text → structured JSON      │
│  │ Agent Summary   │  { name, quantity, category }         │
│  └────────┬────────┘                                       │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                       │
│  │ Step 3: Save    │  POST to Firebase via API             │
│  │ to Firebase     │  /api/firebase/inventory              │
│  └─────────────────┘                                       │
│                                                             │
│  OUTPUT: Structured inventory saved to database            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Example Output:**
```json
{
  "inventory": [
    { "name": "Milk", "quantity": "1 gallon", "category": "dairy" },
    { "name": "Eggs", "quantity": "12", "category": "protein" },
    { "name": "Spinach", "quantity": "1 bunch", "category": "produce" }
  ]
}
```

---

### 👨‍🍳 Subflow 2: `generate-recipes`

**Purpose:** Creates personalized recipes based on inventory and user preferences.

**Wakanda Data Award Goal:** Agent **SUMMARIZES** inventory to generate content.

```
┌─────────────────────────────────────────────────────────────┐
│                    generate-recipes                         │
│              (Recipe AI + Personalization)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  INPUTS:                                                    │
│  ├── skillLevel: beginner|intermediate|advanced            │
│  ├── availableTime: 15-120 minutes                         │
│  ├── dietaryRestriction: None|Vegetarian|Vegan|...        │
│  └── allergies: peanuts, shellfish, etc.                   │
│                                                             │
│  ┌─────────────────┐                                       │
│  │ Step 1: Fetch   │  GET /api/firebase/inventory          │
│  │ Inventory       │  Retrieves current fridge contents    │
│  └────────┬────────┘                                       │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                       │
│  │ Step 2: Recipe  │  AI Chef Agent generates 3 recipes    │
│  │ Agent           │  Considers: time, skill, diet         │
│  └────────┬────────┘                                       │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                       │
│  │ Step 3: Validate│  Ensures recipes are safe & accurate  │
│  │ Recipes         │  Checks allergens, realistic times    │
│  └────────┬────────┘                                       │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                       │
│  │ Step 4: Save    │  POST to Firebase via API             │
│  │ to Firebase     │  /api/firebase/recipes                │
│  └─────────────────┘                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Example Output:**
```json
{
  "recipes": [
    {
      "title": "Spinach & Cheese Omelette",
      "difficulty": "easy",
      "estimatedTimeMinutes": 15,
      "servings": 2,
      "ingredients": ["eggs", "spinach", "cheese", "butter"],
      "steps": ["Beat eggs...", "Sauté spinach...", "Pour eggs..."],
      "nutritionEstimate": { "calories": 280, "protein": "18g" }
    }
  ]
}
```

---

### 🛒 Subflow 3: `create-shopping-list`

**Purpose:** Intelligent gap analysis between recipes and inventory.

**Wakanda Data Award Goal:** Agent makes **DECISIONS** by comparing two data sources.

```
┌─────────────────────────────────────────────────────────────┐
│                  create-shopping-list                       │
│              (Cross-System Decision Making)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐     ┌─────────────────┐               │
│  │ Fetch Inventory │     │ Fetch Recipes   │               │
│  │ (Data Source 1) │     │ (Data Source 2) │               │
│  └────────┬────────┘     └────────┬────────┘               │
│           │                       │                         │
│           └───────────┬───────────┘                         │
│                       │                                     │
│                       ▼                                     │
│           ┌───────────────────────┐                         │
│           │   Shopping Agent      │                         │
│           │   ─────────────────   │                         │
│           │                       │                         │
│           │   DECISION PROCESS:   │                         │
│           │   1. Parse recipes    │                         │
│           │   2. Extract needed   │                         │
│           │   3. Compare vs       │                         │
│           │      inventory        │                         │
│           │   4. Identify GAPS    │                         │
│           │   5. Group by store   │                         │
│           │      section          │                         │
│           │   6. Estimate prices  │                         │
│           └───────────┬───────────┘                         │
│                       │                                     │
│                       ▼                                     │
│           ┌───────────────────────┐                         │
│           │ Save Shopping List    │                         │
│           │ POST /api/firebase/   │                         │
│           │ shopping              │                         │
│           └───────────────────────┘                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Example Output:**
```json
{
  "shoppingList": [
    {
      "name": "Parmesan Cheese",
      "quantity": "100g",
      "category": "dairy",
      "forRecipes": ["Spinach & Cheese Omelette"],
      "priority": "high",
      "estimatedPrice": "$4.99"
    }
  ],
  "summary": {
    "totalItems": 5,
    "estimatedTotal": "$24.50",
    "recipesFullyCovered": ["Quick Salad"],
    "recipesNeedingShopping": ["Pasta Primavera"]
  }
}
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **Firebase Project** with Realtime Database enabled
- **Kestra** instance (Cloud or Docker)
- **Google Gemini API Key**

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/smart-fridge-recipes.git
cd smart-fridge-recipes
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create `.env.local` in the root directory:

```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (for API routes)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Kestra
KESTRA_API_URL=https://your-kestra-instance.io/api/v1
KESTRA_API_TOKEN=your_kestra_token
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔧 Running Kestra Workflows

### Option 1: Kestra Cloud

1. Go to [Kestra Cloud](https://kestra.io/cloud)
2. Import the YAML files from `/kestra/flows/`
3. Add secrets: `GEMINI_API_KEY`
4. Trigger via UI or webhook

### Option 2: Local Docker

```bash
# Start Kestra
docker run --pull=always --rm -it -p 8080:8080 \
  --user=root \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /tmp:/tmp \
  kestra/kestra:latest server local

# Access UI at http://localhost:8080
```

### Deploying Flows

```bash
# Using Kestra CLI
kestra flow namespace update ai.smartfridge ./kestra/flows/ --server=http://localhost:8080
```

### Triggering Workflows

**Via Webhook (from app):**
```typescript
// The app triggers workflows via kestraService.ts
await triggerInventoryFlow(userId, fridgeImageBase64);
await triggerRecipeFlow(userId, 'beginner', 30, 'Vegetarian', 'None');
await triggerShoppingListFlow(userId);
```

**Via Kestra UI:**
1. Navigate to Flows → `ai.smartfridge`
2. Select a flow (e.g., `smart-fridge-main`)
3. Click "Execute"
4. Fill in inputs and run

---

## 📡 API Endpoints

### Kestra Trigger Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/kestra/main` | POST | Trigger full pipeline |
| `/api/kestra/inventory` | POST | Trigger inventory scan |
| `/api/kestra/recipes` | POST | Trigger recipe generation |
| `/api/kestra/shopping` | POST | Trigger shopping list creation |

### Firebase Data Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/firebase/inventory` | GET/POST | Read/write inventory |
| `/api/firebase/recipes` | GET/POST | Read/write recipes |
| `/api/firebase/shopping` | GET/POST | Read/write shopping list |

---

## 🔮 Future Roadmap

- **📱 WhatsApp Integration** – Receive recipes and shopping lists directly in WhatsApp
- **🛍️ Quick Commerce** – One-click ordering from Instacart, Blinkit, Zepto
- **📊 Nutrition Tracking** – Calorie and macro tracking across meals
- **🗓️ Meal Planning** – Weekly meal calendar with auto-scheduling
- **🧠 Learning AI** – Remembers your preferences over time
- **🌍 Multi-language** – Support for regional cuisines and languages

---

## 📚 Learning & Growth

Building this project taught us:

- **🔄 Event-Driven Architecture** – Designing systems that react to events using Kestra
- **🤖 AI Agents** – Creating specialized AI agents for specific tasks
- **📡 Real-time Sync** – Implementing Firebase listeners for instant UI updates
- **🏗️ Workflow Orchestration** – Breaking complex processes into manageable subflows
- **☁️ Cloud Deployment** – Deploying Next.js on Vercel with serverless functions

---

## 🏆 Hackathon Submission

**Wakanda Data Award Highlights:**

1. **Summarization** – `manage-inventory` summarizes visual data into structured JSON
2. **Content Generation** – `generate-recipes` creates content from database summaries
3. **Decision Making** – `create-shopping-list` compares two data sources to make decisions

---

## 📄 License

MIT License - feel free to use and modify!

---

<div align="center">

**Built with ❤️ for the Wakanda Data Award**

[Demo](https://smart-fridge.vercel.app) · [Report Bug](https://github.com/yourusername/smart-fridge-recipes/issues) · [Request Feature](https://github.com/yourusername/smart-fridge-recipes/issues)

</div>
