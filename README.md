# Smart Fridge Recipe Assistant

AI-powered recipe assistant that reads your pantry inventory and suggests recipes plus a shopping list. Built with Next.js App Router, Firebase Auth + Realtime Database, and Gemini (planned Kestra orchestration).

## Quickstart

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

You must configure environment variables before using Firebase or Gemini (see inline TODOs in `lib/firebaseClient.ts`, `lib/firebaseAdmin.ts`, and `lib/gemini.ts`).

### Required environment variables

Create a `.env.local` file in the project root with at least:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
FIREBASE_DATABASE_URL=...

# Optional: direct Gemini API key (until Kestra flow is wired in)
GOOGLE_GEMINI_API_KEY=...
```

Then run the dev server:

```bash
npm install
npm run dev
```
