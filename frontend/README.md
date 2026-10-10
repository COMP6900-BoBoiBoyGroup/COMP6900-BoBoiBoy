# Fruit Identifier - frontend (`frontend/`)

The web UI for the COMP6900 fruit identifier: lets a user upload a photo of
an apple or a banana, sends it off for classification, and shows the
result alongside nutrition facts, health benefits, ripeness tips, and
usage ideas.

This folder is the frontend piece of the COMP6900 fruit identifier. The
backend API lives in `../backend/`, and the trained CNN itself lives in
`../model/` (see `../model/README.md`). The full end-to-end request flow
across all three folders is documented in the root
[`README.md`](../README.md#how-a-request-flows-end-to-end).

Built with **Next.js 14** (App Router), **React 18**, **TypeScript**, and
**Tailwind CSS**. Deployed on **Vercel**.

## Layout

```
frontend/
    app/
        page.tsx                  Main (and only) page - ties the UI together
        layout.tsx                Root HTML layout, page metadata, fonts
        globals.css                Tailwind entrypoint + small global tweaks
        api/predict/route.ts      Server route that forwards photos to the backend
    components/
        ImageUploader.tsx         Pick/drag-drop a photo, show a preview
        ResultPanel.tsx           Decides what to show for the current app state
        FruitInfoCard.tsx         Renders nutrition/health/ripeness/usage info
        ConfidenceBar.tsx         Renders the model's confidence as a progress bar
    lib/
        api.ts                    Calls our own /api/predict route
        types.ts                  Shared TypeScript types (PredictionResult, FruitInfo, ...)
        fruitInfo.ts              Static nutrition/health/ripeness/usage content
    .env.example                 Documents the environment variables below
    tailwind.config.ts           Colour palette + font used across the UI
```

## Running it locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open http://localhost:3000.

If you don't have a backend running yet, set `NEXT_PUBLIC_DEMO_MODE=true`
in `.env.local` - the app will still work end-to-end, just with a random
mock apple/banana result instead of a real prediction (see "Demo mode"
below).

Other scripts (from `package.json`):

```bash
npm run build       # production build (also run in CI)
npm run start        # run a production build locally
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
```

## Environment variables

Set these in `.env.local` for local dev, and under the Vercel project's
**Settings -> Environment Variables** for deployment. See `.env.example`
for the full list with comments; the ones that actually matter today are:

| Variable | Required? | Meaning |
| --- | --- | --- |
| `BACKEND_API_URL` | Yes (unless demo mode is on) | Base URL of the backend, e.g. `https://comp6900-boboiboy-b816.onrender.com` |
| `BACKEND_PREDICT_PATH` | No | Path appended to `BACKEND_API_URL` for the prediction request. Defaults to `/predict`. |
| `NEXT_PUBLIC_DEMO_MODE` | No | When `"true"`, `/api/predict` skips the backend entirely and returns a random mock result. See below. |

`BACKEND_API_KEY` is also listed in `.env.example` as a placeholder for a
shared-secret header, but the backend doesn't check for one yet, so it
isn't currently read by `route.ts`.

## How a photo becomes a result

1. `components/ImageUploader.tsx` lets the user pick or drag a photo and
   validates its type (`jpeg`/`png`/`webp`) and size (under 8 MB) before
   it ever leaves the browser.
2. Clicking "Identify fruit" in `app/page.tsx` calls `identifyFruit()`
   from `lib/api.ts`, which `POST`s the photo as `multipart/form-data` to
   our own route, `app/api/predict/route.ts`.
3. That route (a Vercel serverless function) re-validates the file, then
   forwards it to the real backend at `BACKEND_API_URL + BACKEND_PREDICT_PATH`.
   Going through our own route - instead of calling the backend straight
   from the browser - avoids CORS issues and keeps the backend's URL off
   the client.
4. The backend replies with `{ "label": "apple"|"banana"|"unknown", "confidence": 0.0-1.0 }`.
   That's genuinely the entire response - **no nutrition/health/etc. text
   ever comes from the backend.**
5. `components/ResultPanel.tsx` reads that label, looks up the matching
   entry in the static `lib/fruitInfo.ts` table, and renders it via
   `components/FruitInfoCard.tsx` plus a `ConfidenceBar`. If the
   confidence is below 50% (see `CONFIDENCE_THRESHOLD` in
   `ResultPanel.tsx`), it shows a "couldn't confidently identify" message
   instead of guessing.

See the root [`README.md`](../README.md#how-a-request-flows-end-to-end)
for the full picture including the backend and model side of this.

## Demo mode

Set `NEXT_PUBLIC_DEMO_MODE=true` and `/api/predict` returns a random
apple/banana result with a plausible confidence score instead of calling
the backend (see `getMockPrediction()` in `route.ts`). This exists so the
frontend can be built, tested, and demoed independently of whether the
backend/model are deployed yet - useful for development, and as a
fallback testable environment for marking if the live backend is ever
down.

## Deployment

Deployed on Vercel with the project's **Root Directory** set to
`frontend` (this folder), since the repo is a monorepo and Vercel needs
to know which subfolder to build. It auto-deploys on every push to `main`
(and creates a Preview Deployment for every PR). See the root
[`README.md`](../README.md#deployment) for the live URL and the
backend's deployment details.
