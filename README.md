# PrepPilot — AI Mock Interview Platform

PrepPilot is a production-oriented AI mock interview platform. Users create role-specific interviews, practice over real-time voice, and receive structured, scored feedback.

Built with Next.js 16 (App Router + Turbopack), React 19, Tailwind CSS v4, Firebase Auth/Firestore, Groq-hosted LLMs, OpenAI Realtime voice (with Vapi fallback), and a Vitest suite.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Firestore Setup](#firestore-setup)
- [Scripts](#scripts)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Auth & Security Model](#auth--security-model)
- [Voice & AI Providers](#voice--ai-providers)
- [Deployment](#deployment)
- [Production Operations](#production-operations)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

- **Authentication** — Email/password sign-up and sign-in via Firebase Auth with `HttpOnly` session cookies (`app/(auth)/sign-in`, `app/(auth)/sign-up`, `components/AuthForm.tsx`).
- **Protected routes** — `(root)` layout redirects unauthenticated users to `/sign-in`; `(auth)` layout redirects authenticated users to `/`.
- **Interview generation** — Role/level/tech-stack/amount/type form (`components/InterviewForm.tsx`) calls `POST /api/vapi/generate`, which generates questions with Groq and persists a Firestore `interviews` document.
- **Real-time voice interviews** — `components/Agent.tsx` + `lib/voice/useVoiceInterview.ts` run an OpenAI Realtime WebRTC session (primary) or Vapi (fallback, controlled by `NEXT_PUBLIC_VOICE_PROVIDER`). Transcripts stream over the Realtime data channel.
- **AI feedback** — On call end, `components/InterviewSession.tsx` posts the transcript to `POST /api/feedback/generate`, which scores 5 categories, lists strengths/improvements, and stores a `feedback` document.
- **Feedback pages** — `app/(root)/interview/[id]/feedback/page.tsx` renders overall score, category bars, strengths, improvements, and final assessment, with an empty state when feedback does not exist yet.
- **Dashboard** — `app/(root)/page.tsx` loads the signed-in user's interviews from Firestore with an empty state; cards render deterministic covers and tech icons.

## Architecture

```text
Browser (React 19)
├── app/(auth)              → sign-in / sign-up (public, inverse guard)
├── app/(root)              → protected layouts + pages
│   ├── page.tsx            → dashboard (server: getCurrentUser + getInterviewsByUserId)
│   ├── interview/page.tsx  → creation form (client: InterviewForm)
│   ├── interview/[id]      → voice session (server loads interview, client InterviewSession + Agent)
│   └── interview/[id]/feedback → scored results (server: getFeedbackByInterviewId)
├── components/Agent.tsx    → voice UI over useVoiceInterview hook
└── lib/voice/              → provider abstraction (openai-realtime | vapi)

Server (Next.js Route Handlers + Server Actions)
├── POST /api/vapi/generate       → Groq question generation → Firestore interviews
├── POST /api/realtime/session    → mints OpenAI Realtime client secret (authed)
├── POST /api/feedback/generate   → Groq structured feedback → Firestore feedback
├── lib/actions/auth.action.ts    → signUp / signIn / session cookie / getCurrentUser
├── lib/actions/interviews.actions.ts → user-scoped interview reads
└── lib/actions/feedback.actions.ts   → latest feedback per interview

Data (Firebase)
├── Auth: Firebase Authentication (email/password)
└── Firestore: users / interviews / feedback
```

## Tech Stack

| Layer         | Choice                                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Framework     | `next@16.3.4` (App Router, Turbopack), `react@19.2.8`                                                                  |
| Language      | `typescript@5.8.3` (pinned: `typescript-eslint` in `eslint-config-next` caps at TS <6.1)                               |
| Styling       | `tailwindcss@4`, `@tailwindcss/postcss@4`, `tw-animate-css@1.4.0`                                                      |
| UI            | `shadcn@4.19.0` (`base-nova`), `@base-ui/react@1.7.0`, `class-variance-authority`, `lucide-react`, `sonner`            |
| Forms         | `react-hook-form@7`, `@hookform/resolvers@5`, `zod@4` (`z.email()`, `z.input`/`z.output` for coerced fields)           |
| Auth / Data   | `firebase@12` (client), `firebase-admin@14` (server)                                                                   |
| AI            | `ai@7`, `@ai-sdk/groq@4` (question + feedback LLMs), `@ai-sdk/google@4` (installed), `@vapi-ai/web@2` (voice fallback) |
| Voice         | OpenAI Realtime WebRTC (`gpt-realtime-2.1`, `gpt-4o-mini-transcribe`, server VAD)                                      |
| Testing       | `vitest@3`, `jsdom@26`, `@testing-library/react@16`, `@testing-library/user-event@14`                                  |
| Lint / Format | `eslint@9` (flat config), `prettier@3` + `prettier-plugin-tailwindcss`                                                 |
| CI / Hosting  | GitHub Actions (`.github/workflows/ci.yml`), Vercel                                                                    |

Dependency pins worth knowing:

- `overrides.jose = 4.15.9` — last CommonJS `jose`; required because `firebase-admin → jwks-rsa → jose@6` is ESM-only and breaks `require()` in the bundled server runtime.
- `overrides.uuid = 11.1.1` — resolves the `uuid` GHSA buffer-bounds advisory pulled in via `firebase-admin`.
- `serverExternalPackages: ["firebase-admin", "jose", "jwks-rsa"]` in `next.config.ts` — keeps these out of the Turbopack server bundle for Vercel.

## Prerequisites

- Node.js 20.x (CI uses Node 20; matches `actions/setup-node` and Vercel runtime)
- npm 10+
- A Firebase project (Auth + Firestore enabled)
- A Groq API key ([console.groq.com/keys](https://console.groq.com/keys))
- An OpenAI API key (for Realtime voice)
- Optional: Vapi credentials if using the `vapi` voice fallback

## Getting Started

```bash
# install (CI uses npm ci for reproducible builds)
npm ci

# configure environment
cp .env.example .env.local
# fill in real values — see Environment Variables

# develop (Turbopack)
npm run dev
# → http://localhost:3000

# production build + serve
npm run build
npm start
```

## Environment Variables

`.env.local` is gitignored (`.gitignore` covers `.env*`). Copy `.env.example` and fill in values. Restart `next dev` after changing env files — Next.js loads them at startup.

| Variable                                   | Scope  | Required      | Purpose                                                                                                                             |
| ------------------------------------------ | ------ | ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `FIREBASE_PROJECT_ID`                      | server | yes           | Firebase Admin project                                                                                                              |
| `FIREBASE_CLIENT_EMAIL`                    | server | yes           | Service-account client email                                                                                                        |
| `FIREBASE_PRIVATE_KEY`                     | server | yes           | Service-account private key, single line with literal `\n` newlines. `firebase/admin.ts` converts them via `.replace(/\\n/g, "\n")` |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | public | yes           | Firebase web config                                                                                                                 |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | public | yes           | Firebase web config                                                                                                                 |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | public | yes           | Firebase web config                                                                                                                 |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | public | yes           | Firebase web config                                                                                                                 |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | public | yes           | Firebase web config                                                                                                                 |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | public | yes           | Firebase web config                                                                                                                 |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`      | public | no            | Analytics (optional)                                                                                                                |
| `GROQ_API_KEY`                             | server | yes           | `gsk_…` — question generation + feedback scoring                                                                                    |
| `OPENAI_API_KEY`                           | server | yes for voice | `sk-…` — mints Realtime client secrets server-side; never expose with `NEXT_PUBLIC_`                                                |
| `NEXT_PUBLIC_VOICE_PROVIDER`               | public | no            | `openai-realtime` (default) or `vapi`                                                                                               |
| `NEXT_PUBLIC_VAPI_WEB_TOKEN`               | public | if `vapi`     | Vapi client token                                                                                                                   |
| `NEXT_PUBLIC_VAPI_ASSISTANT_ID`            | public | if `vapi`     | Vapi assistant to start                                                                                                             |

Notes:

- Firebase **web** keys are intentionally public (`NEXT_PUBLIC_*` is inlined into client JS). Access control comes from Firebase Auth + Firestore Security Rules, not key secrecy.
- `OPENAI_API_KEY`, `GROQ_API_KEY`, and `FIREBASE_PRIVATE_KEY` must never use the `NEXT_PUBLIC_` prefix.
- The checked-in `.env.example` currently documents Firebase + Groq + Vapi token; add `OPENAI_API_KEY`, `NEXT_PUBLIC_VOICE_PROVIDER`, and `NEXT_PUBLIC_VAPI_ASSISTANT_ID` when provisioning a new environment.
- Never commit `.env.local` or downloaded service-account JSON files.

Example (values redacted):

```bash
FIREBASE_PROJECT_ID="your-project"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-...@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="1:...:web:..."
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-..."

GROQ_API_KEY="gsk_..."
OPENAI_API_KEY="sk-..."

NEXT_PUBLIC_VOICE_PROVIDER="openai-realtime"
NEXT_PUBLIC_VAPI_WEB_TOKEN="..."
NEXT_PUBLIC_VAPI_ASSISTANT_ID="..."
```

## Firestore Setup

Enable **Authentication → Email/Password** and **Firestore Database** in the Firebase console.

Collections used by the app:

| Collection   | Document ID         | Fields                                                                                                                                                                   |
| ------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `users`      | Firebase Auth `uid` | `name: string`, `email: string`                                                                                                                                          |
| `interviews` | auto-ID             | `role`, `type`, `level`, `techstack: string[]`, `questions: string[]`, `userid` (lowercase, legacy), `finalized: boolean`, `coverImage: string`, `createdAt: ISO string` |
| `feedback`   | auto-ID             | `interviewId`, `userId`, `totalScore`, `categoryScores[5]`, `strengths[]`, `areasForImprovement[]`, `finalAssessment`, `transcript[]`, `createdAt`                       |

Notes for operators:

- The write path stores the owner as lowercase `userid`; reads query `.where("userid", "==", userId)` and map it to the `Interview.userId` TypeScript field. Do not rename one side without migrating the other.
- Dashboard sorting is done in memory (newest `createdAt` first) to avoid a mandatory composite index during early scale. If you restore server-side `.orderBy("createdAt", "desc")` alongside the `userid` filter, create the Firestore composite index (`userid ASC + createdAt DESC`) when Firebase returns `FAILED_PRECONDITION`.
- Feedback reads filter on `interviewId + userId` and pick the newest document client-side for the same reason.
- This repo does not ship `firestore.rules`. Before multi-user production, add rules so users can read/write only their own `users/{uid}`, `interviews` (`resource.data.userid == request.auth.uid`), and `feedback` (`resource.data.userId == request.auth.uid`).

## Scripts

| Script                  | Command                 | Purpose                                         |
| ----------------------- | ----------------------- | ----------------------------------------------- |
| `npm run dev`           | `next dev`              | Local dev with Turbopack                        |
| `npm run build`         | `next build`            | Production build                                |
| `npm start`             | `next start`            | Serve a production build                        |
| `npm run lint`          | `eslint`                | `next/core-web-vitals` + TypeScript rules       |
| `npm test`              | `vitest run`            | Full test suite (currently 105 tests, 17 files) |
| `npm run test:watch`    | `vitest`                | Watch mode                                      |
| `npm run test:coverage` | `vitest run --coverage` | Coverage report                                 |

Formatting:

```bash
npx prettier --check .
npx prettier --write .
```

## Testing

- Runner: Vitest 3 + jsdom. Config: `vitest.config.ts` (`@` alias, `server-only` stub at `tests/mocks/server-only.ts`). Setup/mocks: `tests/setup.ts` (mocks `next/image`, `next/link`, `next/navigation`, `next/font/google`, `sonner`).
- Layout:

```text
tests/
├── setup.ts
├── mocks/server-only.ts
├── lib/utils.test.ts
├── components/   # Button, DisplayTechIcons, FormField, InterviewCard, AuthForm, InterviewForm, InterviewSession
├── app/          # interview [id] page, feedback page
├── api/          # vapi/generate, realtime/session, feedback/generate
├── firebase/     # admin init, auth actions, interviews actions, feedback actions
└── README.md
```

- What's covered: Zod validation and coercion (`z.input`/`z.output`), Groq primary→`groq/compound` fallbacks, question-count enforcement, reasoning-markdown JSON extraction, auth/ownership guards, Firestore mapping/sorting, voice-hook provider selection, form submission → navigation, and feedback page states.
- Run: `npm test`. Type-check: `npx tsc --noEmit --skipLibCheck`. Note: `tsconfig.json` includes tests so editor/CI type-checking resolves the `@/*` alias.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on pushes/PRs to `main`, `workflow`, and `develop`:

1. `npm ci`
2. `npm run lint`
3. `npx tsc --noEmit --skipLibCheck`
4. `npm test --if-present`
5. `npm run build` with dummy Firebase env (build-safe fallbacks in `firebase/client.ts`; Admin init degrades to disabled auth)

Vercel auto-deploys pushes:

- `main` → production domain.
- Other branches (e.g. `workflow`) → preview deployments with unique URLs. Preview URLs are immutable per deployment — always verify the newest deployment after a push.

## Project Structure

```text
app/
├── layout.tsx                        # Root HTML, Mona Sans, Toaster, metadata
├── globals.css                       # Tailwind v4, tw-animate-css, @theme tokens
├── (auth)/layout.tsx                 # Inverse guard: authed → /
├── (auth)/sign-in/page.tsx           # <AuthForm type="sign-in" />
├── (auth)/sign-up/page.tsx           # <AuthForm type="sign-up" />
├── (root)/layout.tsx                 # Guard: unauthenticated → /sign-in + nav
├── (root)/page.tsx                   # Dashboard (async server component)
├── (root)/interview/page.tsx         # Creation page + InterviewForm
├── (root)/interview/[id]/page.tsx    # Session page (loads owned interview → InterviewSession)
├── (root)/interview/[id]/feedback/page.tsx  # Results page
└── api/
    ├── vapi/generate/route.ts        # Interview question generation
    ├── realtime/session/route.ts     # OpenAI Realtime client-secret minting
    └── feedback/generate/route.ts    # Structured feedback generation

components/
├── Agent.tsx              # Voice call UI over useVoiceInterview
├── InterviewSession.tsx   # Call-end → feedback POST → feedback page redirect
├── InterviewForm.tsx      # Creation form (react-hook-form + Zod)
├── InterviewCard.tsx      # Dashboard card (deterministic cover, tech icons)
├── DisplayTechIcons.tsx   # Devicon rendering with /tech.svg fallback
├── AuthForm.tsx           # Sign-in/up form + Firebase client auth
├── FormField.tsx          # Generic Controller wrapper
└── ui/                    # button, input, form, sonner (shadcn base-nova + Base UI)

lib/
├── actions/auth.action.ts        # Server actions: signUp/signIn/session/getCurrentUser
├── actions/interviews.actions.ts # getInterviewsByUserId / getInterviewById (ownership-checked)
├── actions/feedback.actions.ts   # getFeedbackByInterviewId (newest first)
├── voice/config.ts               # Randomized voice/name + instruction builder
├── voice/useVoiceInterview.ts    # WebRTC (OpenAI) + Vapi fallback hook
├── vapi.sdk.ts                   # Legacy Vapi snippet (hook owns lifecycle; do not import in components)
└── utils.ts                      # cn(), getTechLogos(), deterministic getRandomInterviewCover()

firebase/
├── admin.ts   # Resilient Admin init (returns null auth/db when env missing)
└── client.ts  # Web config with build-safe fallbacks

constants/index.ts  # Tech mappings, interview covers, feedbackSchema (Zod)
types/index.d.ts    # Interview, Feedback, User, AgentProps, card/form params
tests/              # Vitest suite (see Testing)
```

## API Reference

All mutating routes require an authenticated session cookie unless noted. Validation errors return `400` with `{ error, details? }`.

### `GET /api/vapi/generate`

Health check. → `200 { success: true, data: "Ready" }`.

### `POST /api/vapi/generate`

Creates an interview. Auth derives `userid` server-side; any client-sent `userid` is ignored.

Request:

```json
{
  "type": "technical | behavioral | mixed",
  "role": "Frontend Developer",
  "level": "senior",
  "techstack": "React, Next.js",
  "amount": 5
}
```

`techstack` accepts a comma-separated string or array; entries are trimmed, empties dropped (empty → `400`). `amount` is coerced to int, range 1–10.

Behavior:

- Primary: `groq("openai/gpt-oss-20b")`; fallback: `groq("groq/compound")`.
- Enforces `questions.length === amount` on both attempts; persists only exact-count output.
- Stores `finalized: false`, deterministic `coverImage`, ISO `createdAt`.

Responses:

- `201 { success: true, interviewId }`
- `400` invalid JSON / schema / empty tech stack
- `401` unauthenticated
- `500` database unconfigured; unhandled generation failure propagates as `500`

### `POST /api/realtime/session`

Mints an OpenAI Realtime client secret for the browser. Requires auth.

Request body (all optional, defaults shown):

```json
{
  "username": "Mahim",
  "role": "software engineer",
  "level": "general",
  "techstack": [],
  "questions": []
}
```

Behavior:

- Builds instructions via `getRealtimeConfig()` (random voice/name + personalized greeting).
- Sends `OpenAI-Safety-Identifier` (SHA-256 of user ID) when creating the client secret.
- Uses `POST https://api.openai.com/v1/realtime/client_secrets` with `gpt-realtime-2.1`, `gpt-4o-mini-transcribe`, and `server_vad`.

Responses:

- `200` OpenAI client-secret payload (contains ephemeral `value`)
- `401` unauthenticated
- `500` missing `OPENAI_API_KEY` or session creation failure

### `GET /api/feedback/generate`

Health check. → `200 { success: true, data: "Ready" }`.

### `POST /api/feedback/generate`

Scores a completed interview. Requires auth + interview ownership.

Request:

```json
{
  "interviewId": "abc123",
  "transcript": [
    { "role": "assistant", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "feedbackId": "optional-existing-id"
}
```

Behavior:

- Primary: `generateObject({ model: groq("openai/gpt-oss-20b"), schema: feedbackSchema })`; fallback: `generateText({ model: groq("groq/compound") })` + JSON extraction. Both-models-fail → `502`.
- Saves `{ ...feedback, interviewId, userId, transcript, createdAt }`; marks the interview `finalized: true`.

Responses:

- `201 { success: true, feedbackId }`
- `400` invalid JSON/schema/empty transcript
- `401` unauthenticated
- `404` interview not found/not owned (or feedback ID mismatch on update)
- `502` generation failed on both models

## Auth & Security Model

- **Client auth** (`firebase/client.ts`): Firebase web SDK signs users in; ID tokens are exchanged server-side for `HttpOnly`, `SameSite=Lax`, one-week session cookies (`lib/actions/auth.action.ts`).
- **Server auth** (`firebase/admin.ts`): Verifies session cookies with revocation check. Init is resilient — missing/invalid env yields `null` auth/db plus a warning instead of crashing prerender/build.
- **Route guards**: `(root)` layout requires `isAuthenticated()`; API routes call `getCurrentUser()` and return `401` when absent.
- **Ownership enforcement**: `getInterviewById(id, userId)` and `getFeedbackByInterviewId(id, userId)` reject cross-user access; generation/feedback routes derive identity from the session, never trust client-supplied user IDs.
- **Secrets discipline**: `OPENAI_API_KEY`, `GROQ_API_KEY`, `FIREBASE_PRIVATE_KEY` are server-only. Only `NEXT_PUBLIC_*` values ship to the browser.
- **Remaining hardening before large-scale launch**: add `firestore.rules` (per-user read/write), add rate limiting on generation/feedback routes, set Firestore TTL/retention if needed, and rotate any secret ever pasted into logs or chat.

## Voice & AI Providers

- **Voice primary — OpenAI Realtime**: browser fetches an ephemeral token from `/api/realtime/session`, captures mic via `getUserMedia`, negotiates WebRTC against `https://api.openai.com/v1/realtime/calls`, plays remote audio via `ontrack`, and receives transcripts over the `oai-events` data channel. Status lifecycle: `INACTIVE → CONNECTING → ACTIVE → FINISHED`, with transcript accumulation and `onFinished` delivery.
- **Voice fallback — Vapi**: enabled with `NEXT_PUBLIC_VOICE_PROVIDER=vapi` plus `NEXT_PUBLIC_VAPI_WEB_TOKEN` and `NEXT_PUBLIC_VAPI_ASSISTANT_ID`. Saved questions/username are forwarded as `assistantOverrides.variableValues`. Do not import `lib/vapi.sdk.ts` in components — it starts a call at module load; the hook owns the lifecycle.
- **LLMs (Groq, free tier)**: `openai/gpt-oss-20b` primary, `groq/compound` fallback for both question generation (exact-count enforced) and feedback (structured object with JSON-extraction fallback).
- **Speech config**: transcription `gpt-4o-mini-transcribe`, `server_vad` turn detection, randomized interviewer voice/name from `lib/voice/config.ts`.

## Deployment

Vercel is the reference target.

1. Push to `main` (production) or a feature branch (preview).
2. Set **all** production environment variables in Vercel → Project → Settings → Environment Variables (same list as [Environment Variables](#environment-variables)).
3. Notes:
   - Paste `FIREBASE_PRIVATE_KEY` as a single line with literal `\n` sequences.
   - `next.config.ts` already externalizes `firebase-admin`/`jose`/`jwks-rsa` and allows `cdn.jsdelivr.net` remote images (devicon URLs).
   - `typescript.ignoreBuildErrors` is currently `true`; keep it only as a temporary deploy unblocker and fix type errors properly before launch.
4. Verify the newest deployment: Vercel → Deployments → latest → visit its URL. Preview URLs are per-deployment and immutable.

## Production Operations

- **Scaling profile**: reads are user-scoped; dashboard/feedback sorting is in-memory to avoid mandatory composite indexes at small scale. For large tenants, move sorting server-side with Firestore composite indexes and paginate (`limit` + cursors).
- **AI cost controls**: Groq free tier is generous but rate-limited; add per-user rate limits and request timeouts on `/api/*/generate` before public launch. OpenAI Realtime is usage-billed — monitor minutes per interview.
- **Observability**: generation routes log primary-model failures before fallback (`console.warn`) and dual failures (`console.error`). Ship these to your log provider and alert on elevated `502`s from feedback generation.
- **Data lifecycle**: transcripts are stored inside `feedback` documents. Confirm retention/privacy requirements before launch; consider redaction or TTL for audio-adjacent data.
- **Backups**: schedule Firestore exports (e.g. `gcloud firestore export`) once real user data exists.

## Troubleshooting

| Symptom                                                                            | Likely cause                                                            | Fix                                                                                                                                                                   |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Firebase admin init failed: Failed to parse private key` (`ERR_OSSL_UNSUPPORTED`) | Malformed `FIREBASE_PRIVATE_KEY` (missing base64 chars from copy/paste) | Generate a fresh service-account key; keep it on one line with literal `\n`; validate with `crypto.createPrivateKey({ key, format: "pem" })`; rotate any exposed keys |
| `GET / 500`, `ERR_REQUIRE_ESM: jose` / `jwks-rsa`                                  | Bundled `firebase-admin` ESM graph                                      | Keep `serverExternalPackages` + `overrides.jose@4.15.9`; redeploy and verify the newest deployment                                                                    |
| `9 FAILED_PRECONDITION: query requires an index`                                   | `where + orderBy` without composite index                               | Click the Firebase console link to create it, or keep the in-memory sort path used by the current actions                                                             |
| `auth/invalid-api-key` during `next build`                                         | Missing `NEXT_PUBLIC_FIREBASE_*` in CI                                  | Provide dummy CI env (already in `ci.yml`); set real values in Vercel                                                                                                 |
| `typescript-eslint does not support TS 7.0`                                        | TS drift beyond `eslint-config-next` peer range                         | Stay on `typescript@5.8.3` until upstream supports newer                                                                                                              |
| `zodResolver` type error on coerced `amount`                                       | Zod input vs output types differ                                        | Type the form as `useForm<z.input<S>, undefined, z.output<S>>`                                                                                                        |
| Hydration mismatch on covers/dates                                                 | `Math.random()` / `Date.now()` during render                            | Covers are deterministic by ID hash; dates use a `useState` initializer + `useMemo`                                                                                   |
| Realtime `401` in tests                                                            | Route requires auth                                                     | Mock `getCurrentUser` and pass a `Request` with JSON body                                                                                                             |

## License

Private project
