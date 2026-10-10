# COMP6900 Fruit Identifier

A web app that identifies whether an uploaded photo is an **apple** or a
**banana** using a trained Convolutional Neural Network, then shows
nutrition facts, health benefits, ripeness tips, and usage/serving ideas
for the identified fruit.

This repository is the team submission for **Project 4: CNN Application to
Identify a Fruit**.

**Live app:** https://boboiboy-project.vercel.app

## Repository layout

This is a monorepo containing each part of the project as its own
top-level folder, so every team member's work lives side-by-side:

```
frontend/   Web UI (Next.js, deployed on Vercel) - upload a photo, show results
backend/    FastAPI service that receives the image and returns a prediction
            (deployed on Render)
model/      CNN training/evaluation code + the trained model (see model/README.md)
dataset/    Training/testing images and dataset notes (not yet added - large
            raw images should NOT be committed directly once it is, see
            the note in .gitignore)
```

## How a request flows end-to-end

This is the full path a photo takes from the browser to a result on screen,
and where each piece of that is implemented:

1. **Upload (browser):** `frontend/components/ImageUploader.tsx` lets the
   user pick/drag a photo and shows a preview. Clicking "Identify fruit" in
   `frontend/app/page.tsx` calls `identifyFruit()`.
2. **Frontend → our own API route:** `frontend/lib/api.ts` sends the photo
   as `multipart/form-data` to our own Next.js route, `POST /api/predict`.
3. **Our API route → the backend:** `frontend/app/api/predict/route.ts`
   (a serverless function that runs on Vercel) validates the file, then
   forwards it to the real backend at `BACKEND_API_URL + BACKEND_PREDICT_PATH`
   (an environment variable set in the Vercel project settings - see
   `frontend/.env.example`). Going through our own route instead of calling
   the backend directly from the browser avoids CORS and keeps the
   backend's URL off the client.
4. **Backend inference:** `backend/main.py` (`POST /predict`, deployed on
   Render) receives the image and calls `predict_image()` from
   `model/model_inference.py`, which runs the trained CNN
   (`model/weights/best_custom_cnn.pth`) and returns a dict with the raw
   `Status`, `Top Probability`, `Energy Score`, and per-class probabilities
   (see `model/README.md` for exactly how that score is computed).
5. **Backend reshapes the result:** `backend/main.py` converts that raw
   dict into the small JSON shape the frontend expects:
   `{ "label": "apple" | "banana" | "unknown", "confidence": 0.0-1.0 }`.
   This is the *only* thing that crosses the network back to the frontend -
   the backend does not send any nutrition/health/usage text.
6. **Our API route returns it to the browser**, after checking the shape
   looks valid (see the `isValidLabel` check in `route.ts`).
7. **Result UI (where the "nutrition/health/ripeness/usage" design
   actually lives):**
   - `frontend/components/ResultPanel.tsx` decides what to show for the
     current status (loading / error / low-confidence / success).
   - `frontend/lib/fruitInfo.ts` is a **static, hand-written** lookup table
     (not sent by the backend at all) mapping `"apple"`/`"banana"` to their
     nutrition facts, health benefits, ripeness tips, and usage ideas.
   - `frontend/components/FruitInfoCard.tsx` is the actual layout/design for
     that info once a label comes back - it just renders whichever
     `FruitInfo` entry `ResultPanel` looked up.
   - `frontend/components/ConfidenceBar.tsx` renders the confidence score
     as a progress bar.

In short: **the model only ever returns a label + a confidence number** -
everything else the user sees (nutrition tables, health tips, etc.) is
frontend-only static content, selected based on that label.

## Frontend

Quick start:

```bash
cd frontend
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_DEMO_MODE=true to try it without a backend
npm run dev
```

See `frontend/.env.example` for the environment variables the frontend
reads (`BACKEND_API_URL`, `BACKEND_PREDICT_PATH`, `NEXT_PUBLIC_DEMO_MODE`).

## Backend

Run these commands from the **repo root** (not inside `backend/`) - the
backend imports from the sibling `model/` folder, so Python needs to be
run with the repo root as the working directory for that import to work.

Optionally, create and activate a python virtual environment first.
Depending on your environment, you may need to instead use `python3` and
`pip3` for the following commands.

```bash
python -m venv .venv
source .venv/bin/activate   # on Windows: .venv\Scripts\activate
```

Then, install the requirements for the model and fastapi:
```bash
pip install -r model/requirement.txt
pip install "fastapi[standard]"
```

Finally, run the backend with:
```bash
uvicorn backend.main:app --reload
```

## Deployment

| Part | Host | Live URL | Notes |
| --- | --- | --- | --- |
| Frontend | Vercel | https://boboiboy-project.vercel.app | Project root directory set to `frontend/`; auto-deploys on every push to `main` |
| Backend | Render | https://comp6900-boboiboy-b816.onrender.com | Web Service, repo root as-is (not scoped to `backend/`, since it needs `model/` as a sibling folder); Build Command: `pip install -r model/requirement.txt "fastapi[standard]"`; Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT` |

The frontend is wired to the backend via one environment variable set in
the Vercel project settings: `BACKEND_API_URL=https://comp6900-boboiboy-b816.onrender.com`.

> Vercel was also tried for the backend first, but a Python Serverless
> Function there has a 500 MB bundle size limit, and PyTorch + torchvision
> alone come to ~800 MB even with the CPU-only build - too big. Render has
> no such limit for a regular web service, so that's what the backend
> actually runs on.

## CI/CD

- **CI:** [`.github/workflows/frontend-ci.yml`](.github/workflows/frontend-ci.yml)
  runs lint, type-check, and build for `frontend/` on every push/PR that
  touches that folder. `backend/`/`model/` don't have an automated CI
  workflow yet - a `backend-ci.yml` scoped the same way (with a `paths`
  filter) would be a good follow-up.
- **CD:** Vercel is connected directly to this GitHub repo and auto-deploys
  `frontend/` on every push to `main` (with Preview Deployments for PRs),
  with Root Directory set to `frontend` in the Vercel project settings.
  Render auto-deploys the backend the same way on every push to `main`.

## Project brief checklist

| Requirement | Status |
| --- | --- |
| 1. Source/collect training & testing dataset (~2000+ images) | Used for training (see `model/scripts/custom_cnn_training.ipynb`); not committed to this repo (see `dataset/` note above) |
| 2. Identify apple + banana (bare minimum) | Done - trained CNN in `model/`, served via `backend/`, deployed and connected to `frontend/` |
| 3. Upload a photo → CNN classifies it | Done end-to-end (see "How a request flows end-to-end" above) |
| 4. Show nutrition/health/ripeness/usage info once identified | Done in `frontend/` (`lib/fruitInfo.ts` + `components/FruitInfoCard.tsx`) |
| 5. All code commented, with explanation of how it was built | Done for `frontend/` and `backend/`; see `model/README.md` for the model |
| 6. A testable environment for marking/demo | Live at https://boboiboy-project.vercel.app; `frontend/` also supports a demo mode (`NEXT_PUBLIC_DEMO_MODE=true`) that works without the backend |
| 7. Submit all code + datasets + project document | In progress - keep committing to this repo; add the final write-up (e.g. `docs/`) before submission |
