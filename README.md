# COMP6900 Fruit Identifier

A web app that identifies whether an uploaded photo is an **apple** or a
**banana** using a trained Convolutional Neural Network, then shows
nutrition facts, health benefits, ripeness tips, and usage/serving ideas
for the identified fruit.

This repository is the team submission for **Project 4: CNN Application to
Identify a Fruit**.

## Repository layout

This is a monorepo containing each part of the project as its own
top-level folder, so every team member's work lives side-by-side:

```
frontend/   Web UI (Next.js, deployed on Vercel) - upload a photo, show results
backend/    API that receives the image and returns a prediction (TBD - teammate)
model/      CNN training/evaluation code + the trained model (TBD - teammate)
dataset/    Training/testing images and dataset notes (TBD - large raw images
            should NOT be committed directly - see dataset/README.md once added)
```

## Frontend

Quick start:

```bash
cd frontend
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_DEMO_MODE=true to try it without a backend
npm run dev
```

## CI/CD

- **CI:** [`.github/workflows/frontend-ci.yml`](.github/workflows/frontend-ci.yml)
  runs lint, type-check, and build for `frontend/` on every push/PR that
  touches that folder. Other team members should add their own
  `*-ci.yml` workflow (e.g. `backend-ci.yml`, `model-ci.yml`) scoped the
  same way with a `paths` filter, so everyone's checks stay independent.
- **CD:** Vercel is connected directly to this GitHub repo and auto-deploys
  `frontend/` on every push to `main` (with Preview Deployments for PRs),
  with Root Directory set to `frontend` in the Vercel project settings.

## Project brief checklist

| Requirement | Status |
| --- | --- |
| 1. Source/collect training & testing dataset (~2000+ images) | Pending (`dataset/`) |
| 2. Identify apple + banana (bare minimum) | Frontend ready; depends on model |
| 3. Upload a photo → CNN classifies it | Frontend done (`frontend/`); backend/model pending |
| 4. Show nutrition/health/ripeness/usage info once identified | Done in `frontend/` (`lib/fruitInfo.ts`) |
| 5. All code commented, with explanation of how it was built | Done for `frontend/`; apply same standard to `backend/`/`model/` |
| 6. A testable environment for marking/demo | `frontend/` supports a demo mode independent of the backend; full env depends on backend+model deployment |
| 7. Submit all code + datasets + project document | In progress - keep committing to this repo; add the final write-up (e.g. `docs/`) before submission |
