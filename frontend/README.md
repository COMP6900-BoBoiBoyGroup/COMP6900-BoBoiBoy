# Fruit Identifier (Frontend)

Frontend web app for **Project 4: CNN Application to Identify a Fruit**.

A user uploads a photo of an apple or a banana. The frontend sends it to a
backend service, which calls the trained CNN model (directly or via a
hosted inference API) to classify the image, then returns the result. The
frontend displays the identified fruit along with nutrition facts, health
benefits, ripeness tips, and serving/usage ideas.

**This folder contains only the frontend.** The model training code,
dataset, and backend inference service live in sibling top-level folders
of this repo (`backend/`, `model/`, `dataset/`) - see the
[root README](../README.md) for the overall repo layout, and
[Architecture](#architecture) below for how this app talks to the backend.

## Tech stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** for styling
- Deployed on **Vercel**, with GitHub Actions for CI

## Architecture

```
┌─────────────┐      multipart/form-data      ┌───────────────────┐      image / JSON      ┌────────────────────┐
│   Browser   │ ─────────────────────────────▶ │ /api/predict       │ ──────────────────────▶ │   Backend service   │
│ (this app)  │                                 │ (Next.js route,     │                        │ (owns/calls the CNN │
│             │ ◀───────────────────────────── │  runs on Vercel)    │ ◀────────────────────── │  model API)         │
└─────────────┘      { label, confidence }      └───────────────────┘      { label, confidence } └────────────────────┘
```

- The browser never talks to the backend directly. It POSTs the chosen
  image to this app's own `/api/predict` route (a Vercel serverless
  function).
- `/api/predict` (see [`app/api/predict/route.ts`](app/api/predict/route.ts))
  forwards the image to `BACKEND_API_URL` + `BACKEND_PREDICT_PATH`, waits
  for the JSON prediction, normalises it, and returns it to the browser.
- This proxy pattern avoids CORS issues, keeps the backend URL/keys out of
  client-side JS, and lets the backend's contract change without touching
  frontend UI code.

### Expected backend contract

`POST {BACKEND_API_URL}{BACKEND_PREDICT_PATH}` (default path: `/predict`)

- **Request:** `multipart/form-data` with a single file field named `image`.
- **Response (200):** JSON, e.g.

  ```json
  { "label": "apple", "confidence": 0.94 }
  ```

  `label` must be `"apple"`, `"banana"`, or `"unknown"`. `confidence` is a
  number between 0 and 1. The route handler also tolerates `class`/`prediction`
  and `probability`/`score` as alternate key names - see
  `normalizeBackendResponse` in `app/api/predict/route.ts` if your backend
  uses different field names.

## Project structure

```
app/
  layout.tsx          Root HTML shell + page metadata
  page.tsx             Main UI: upload, trigger identification, show result
  globals.css          Tailwind entry point
  api/predict/route.ts Serverless proxy to the backend model service
components/
  ImageUploader.tsx     Drag-and-drop / click-to-upload with preview + validation
  ResultPanel.tsx       Chooses what to render for idle/loading/error/success
  ConfidenceBar.tsx     Visual confidence (%) bar
  FruitInfoCard.tsx     Nutrition / health / ripeness / usage content
lib/
  types.ts             Shared TypeScript types (FruitLabel, PredictionResult, ...)
  fruitInfo.ts          Static knowledge base (nutrition, health, ripeness, usage)
  api.ts                Client-side fetch helper for /api/predict
vercel.json              Explicit Vercel framework hint

../.github/workflows/frontend-ci.yml   CI workflow (lives at the repo root - see note below)
```

Every file has comments explaining *why* it exists and how it was built,
per the project brief's requirement that all code be documented.

## Getting started locally

**Prerequisites:** Node.js 18.18+ (Node 20 recommended) and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

### Running without a backend yet (demo mode)

If the model backend isn't ready, set this in `.env.local`:

```
NEXT_PUBLIC_DEMO_MODE=true
```

`/api/predict` will then return a random mock `{ label, confidence }`
instead of calling a real backend, so you can build/test/demo the full UI
flow independently. **Turn this off (`false`) before connecting a real
backend or before final submission**, otherwise results will be fake.

### Connecting a real backend

In `.env.local` (and in Vercel's environment variables for production):

```
NEXT_PUBLIC_DEMO_MODE=false
BACKEND_API_URL=https://your-backend-url.example.com
BACKEND_PREDICT_PATH=/predict
BACKEND_API_KEY=your-shared-secret   # optional
```

## Deployment (Vercel + Git CI/CD)

> **Note - this project lives in a monorepo.** This `frontend/` folder is
> one of several top-level folders in the team's
> `richard0537/COMP6900-BoBoiBoy` repo (alongside `backend/`, `model/`,
> `dataset/` as teammates add them). That changes two things vs. a typical
> single-app repo:
>
> - Vercel must be told to build **only this subfolder** (via "Root
>   Directory", below) - otherwise it will try to build the whole repo.
> - The CI workflow lives at the **repo root**
>   (`../.github/workflows/frontend-ci.yml`), because GitHub only reads
>   workflows from `<repo-root>/.github/workflows/`, never from a
>   subfolder. It's scoped with `paths: ["frontend/**"]` and
>   `working-directory: frontend` so it only runs for, and only touches,
>   this project.

1. **Push to GitHub.** This repo's `origin` points at
   `https://github.com/richard0537/COMP6900-BoBoiBoy.git` - commit and
   push as normal (`git add`, `git commit`, `git push`).
2. **Import the repo in Vercel:** [vercel.com/new](https://vercel.com/new) →
   select the `COMP6900-BoBoiBoy` repo → Framework Preset auto-detects
   "Next.js".
3. **Set the Root Directory (critical for this monorepo):** in the import
   screen (or later under Project → Settings → General → "Root Directory"),
   set it to:

   ```
   frontend
   ```

   This tells Vercel to run all builds/installs from inside `frontend/`
   and ignore the other project folders in the repo.
4. **Set environment variables** in Vercel: Project → Settings →
   Environment Variables → add `BACKEND_API_URL`, `BACKEND_PREDICT_PATH`,
   `BACKEND_API_KEY` (if used), and `NEXT_PUBLIC_DEMO_MODE=false` for
   Production. You can set different values per environment (Production /
   Preview / Development).
5. **That's it for CD:** Vercel automatically builds and deploys on every
   push to the production branch (e.g. `main`) that touches `frontend/`,
   and creates a unique **Preview Deployment** URL for every pull
   request/branch - great for sharing with teammates or markers before
   merging.
6. **CI runs separately in GitHub Actions**
   ([`../.github/workflows/frontend-ci.yml`](../.github/workflows/frontend-ci.yml)):
   lint → type-check → build, on every push/PR that touches `frontend/`.
   Enable branch protection on `main` (GitHub repo Settings → Branches) and
   require the "Frontend CI" check to pass before merging, so broken code
   can't reach the deployed branch.

### CI/CD flow summary

```
git push (touching frontend/) → GitHub Actions "Frontend CI" (lint, typecheck, build)
                 │
                 └── pass? → Vercel Git integration builds & deploys
                              Root Directory = "frontend"
                              (Preview deployment for PRs/branches,
                               Production deployment for main)
```

## Scripts

| Command            | Purpose                                   |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | Start local dev server with hot reload     |
| `npm run build`     | Production build (also run by Vercel/CI)   |
| `npm run start`     | Serve the production build locally         |
| `npm run lint`      | ESLint (Next.js config)                    |
| `npm run typecheck` | TypeScript type checking, no file output   |

## Extending to more fruits (stretch goal)

1. Add the new label to `FruitLabel` in `lib/types.ts`.
2. Add a corresponding entry to `FRUIT_INFO` in `lib/fruitInfo.ts` with its
   nutrition/health/ripeness/usage content.
3. Make sure the backend model/API returns the new label string.

No other frontend changes are required - `ResultPanel`/`FruitInfoCard`
render whatever is in the knowledge base generically.
