# api/index.py
#
# Entry point for Vercel's Python runtime. Vercel auto-detects any .py
# file under /api that exports a variable named `app` and serves it as a
# serverless function - here, we just re-export the real FastAPI app that
# lives in backend/main.py, so that file doesn't need to know anything
# about Vercel.
import os
import sys

# Make sure the repo root (this file's parent folder) is importable, so
# `backend.main` can in turn import `model.model_inference` as a sibling
# package.
repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

from backend.main import app  # noqa: E402 (import after sys.path setup is intentional)
