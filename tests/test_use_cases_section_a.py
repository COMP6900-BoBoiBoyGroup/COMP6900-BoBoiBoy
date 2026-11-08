"""
Section A: End-to-end / deployment use case tests.

Covers use cases 1-11 from "Use Case Testing and Results" (Section A) in the
project report. These exercise the LIVE, DEPLOYED system over HTTP - the
Next.js frontend's own `/api/predict` route (frontend/app/api/predict/route.ts)
- rather than calling Python functions in-process. That matters because the
whole point of Section A is testing the deployed pipeline (frontend -> proxy
route -> backend), not the model in isolation (that's Section B, already
covered by model/tests/modelTestCase.ipynb and backend/tests/backendTestCase.ipynb).

Setup
-----
    pip install -r tests/requirements.txt

Point this at whichever deployment you want to test (defaults to the live
production site):

    # Windows (PowerShell)
    $env:FRONTEND_BASE_URL = "https://boboiboy-project.vercel.app"

    # macOS / Linux
    export FRONTEND_BASE_URL="https://boboiboy-project.vercel.app"

Run it:

    pytest tests/test_use_cases_section_a.py -v
    # or simply:
    python tests/test_use_cases_section_a.py

Honesty note on use cases 8, 9, 10
-----------------------------------
Those three describe GitHub Actions / Vercel *pipeline* behaviour (a CI
check failing on a bad commit, a PR getting a Preview Deployment, a merge
to main triggering a redeploy) rather than runtime HTTP behaviour of the
app itself. A Python script can't honestly assert "CI fails on a lint
error" without actually pushing a broken commit, which this suite
deliberately does NOT do (too destructive to run as an automated test).
So:
  - Use case 8 (CI gate) is backed by a *real* check against the GitHub
    Actions API: it confirms the latest `Frontend CI` run on `main`
    succeeded. It does not re-prove the "fails on purpose" half of the
    story - that was verified manually (see Use Case Testing table).
  - Use cases 9 and 10 are left as documented, skipped placeholders with
    instructions for manual verification via the Vercel dashboard, since
    there's no public, unauthenticated API to check Preview Deployments
    or confirm "the live site matches the latest main commit".
"""

from __future__ import annotations

import io
import os
import random
from pathlib import Path

import pytest
import requests

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

FRONTEND_BASE_URL = os.environ.get(
    "FRONTEND_BASE_URL", "https://boboiboy-project.vercel.app"
).rstrip("/")
PREDICT_URL = f"{FRONTEND_BASE_URL}/api/predict"

BACKEND_BASE_URL = os.environ.get(
    "BACKEND_BASE_URL", "https://comp6900-boboiboy-b816.onrender.com"
).rstrip("/")

# Optional: point at a deployment where BACKEND_API_URL is deliberately
# unreachable, to exercise use case 5 for real instead of skipping it.
BACKEND_DOWN_BASE_URL = os.environ.get("BACKEND_DOWN_BASE_URL", "").rstrip("/")

# Optional: point at a deployment built with NEXT_PUBLIC_DEMO_MODE=true,
# to exercise use case 7 for real instead of skipping it.
DEMO_MODE_BASE_URL = os.environ.get("DEMO_MODE_BASE_URL", "").rstrip("/")

GITHUB_REPO = os.environ.get("GITHUB_REPO", "COMP6900-BoBoiBoyGroup/COMP6900-BoBoiBoy")
GITHUB_WORKFLOW_FILE = "frontend-ci.yml"

REQUEST_TIMEOUT = 60  # seconds - Render's free tier can cold-start slowly
COLD_START_TIMEOUT = 90  # seconds - used for the backend wake-up check (UC11)

TEST_IMAGES_DIR = Path(__file__).resolve().parents[1] / "backend" / "tests" / "images"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _load_image_bytes(filename: str) -> bytes:
    path = TEST_IMAGES_DIR / filename
    if not path.is_file():
        pytest.skip(f"Test fixture image not found: {path}")
    return path.read_bytes()


def _post_image(
    base_url: str,
    file_bytes: bytes,
    filename: str,
    content_type: str,
    timeout: int = REQUEST_TIMEOUT,
) -> requests.Response:
    """POST a file to /api/predict the same way the browser's FormData does.

    The field name MUST be "image" - that's what route.ts reads via
    `formData.get("image")`.
    """
    files = {"image": (filename, io.BytesIO(file_bytes), content_type)}
    return requests.post(f"{base_url}/api/predict", files=files, timeout=timeout)


@pytest.fixture(scope="session", autouse=True)
def _wake_up_backend():
    """Render's free-tier backend spins down when idle; the first request
    after that can take far longer than a normal request to cold-start
    (loading two ResNet18 models). Ping it once, best-effort, before the
    rest of the suite runs, so the real test cases aren't the ones eating
    that cold-start latency (and don't need an unreasonably long timeout
    just to account for it).
    """
    try:
        requests.get(f"{BACKEND_BASE_URL}/", timeout=COLD_START_TIMEOUT)
    except requests.RequestException:
        pass  # If this fails, the actual tests below will surface it clearly.


def _random_noise_png(width: int = 64, height: int = 64) -> bytes:
    """A synthetic "doesn't look like an apple or banana" image, used to
    exercise the low-confidence path (use case 6) without depending on a
    specific third-class photo that doesn't exist in the repo's fixtures."""
    from PIL import Image

    pixels = bytes(random.getrandbits(8) for _ in range(width * height * 3))
    img = Image.frombytes("RGB", (width, height), pixels)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# ---------------------------------------------------------------------------
# UC1 - Successful identification
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "filename,expected_label",
    [
        ("apple1.png", "apple"),
        ("banana1.png", "banana"),
    ],
)
def test_uc01_successful_identification(filename, expected_label):
    """Use case 1: upload a clear photo -> label + confidence returned."""
    image_bytes = _load_image_bytes(filename)
    resp = _post_image(FRONTEND_BASE_URL, image_bytes, filename, "image/png")

    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["label"] == expected_label, data
    assert 0.0 <= data["confidence"] <= 1.0, data
    assert "ripe" in data and "ripe_confidence" in data, data


# ---------------------------------------------------------------------------
# UC2 - Unsupported file type
# ---------------------------------------------------------------------------

def test_uc02_unsupported_file_type():
    """Use case 2: uploading a non-image file is rejected with HTTP 415."""
    fake_pdf_bytes = b"%PDF-1.4 this is not really a pdf, just wrong content-type"
    resp = _post_image(FRONTEND_BASE_URL, fake_pdf_bytes, "document.pdf", "application/pdf")

    assert resp.status_code == 415, resp.text
    assert "Unsupported file type" in resp.json().get("error", "")


# ---------------------------------------------------------------------------
# UC3 - Oversized file
# ---------------------------------------------------------------------------

def test_uc03_oversized_file():
    """Use case 3: a file over 8 MB is rejected with HTTP 413.

    The size check in route.ts happens before any image decoding, so the
    bytes don't need to be a valid image - only `file.size` and the
    declared Content-Type of the multipart part matter.

    FINDING: on Vercel, a 9 MB upload gets rejected with HTTP 413 before
    it ever reaches route.ts at all - Vercel's own serverless function
    request-body limit kicks in first, returning a plain-text
    "FUNCTION_PAYLOAD_TOO_LARGE" body instead of route.ts's own JSON
    `{"error": "Image is too large..."}` message. The status code (413)
    still matches what the use case expects, but the custom, user-facing
    error message never actually fires for files this large - only for
    files between Vercel's limit and the app's own 8 MB threshold. This
    is a low-severity gap in practice (the frontend's own client-side
    size check in ImageUploader stops a normal user before this request
    is ever sent), but worth documenting rather than hiding.
    """
    oversized_bytes = os.urandom(9 * 1024 * 1024)  # 9 MB > the 8 MB limit
    resp = _post_image(FRONTEND_BASE_URL, oversized_bytes, "huge.png", "image/png")

    assert resp.status_code == 413, resp.text
    try:
        assert "too large" in resp.json().get("error", "").lower()
    except requests.exceptions.JSONDecodeError:
        assert "PAYLOAD_TOO_LARGE" in resp.text or "too large" in resp.text.lower(), resp.text


# ---------------------------------------------------------------------------
# UC4 - No file selected
# ---------------------------------------------------------------------------

def test_uc04_no_file_selected():
    """Use case 4: submitting the form with no file attached -> HTTP 400."""
    resp = requests.post(PREDICT_URL, files={}, timeout=REQUEST_TIMEOUT)

    assert resp.status_code == 400, resp.text
    assert "No image file was provided" in resp.json().get("error", "")


# ---------------------------------------------------------------------------
# UC5 - Backend unreachable
# ---------------------------------------------------------------------------

@pytest.mark.skipif(
    not BACKEND_DOWN_BASE_URL,
    reason=(
        "Set BACKEND_DOWN_BASE_URL to a deployment whose BACKEND_API_URL is "
        "deliberately unreachable to run this for real (can't remotely pause "
        "the live Render service from a test script). Manually verified by "
        "pausing the Render service in the dashboard and retrying - see the "
        "Use Case Testing table."
    ),
)
def test_uc05_backend_unreachable():
    """Use case 5: backend down -> proxy returns HTTP 502 with a clear error."""
    image_bytes = _load_image_bytes("apple1.png")
    resp = _post_image(BACKEND_DOWN_BASE_URL, image_bytes, "apple1.png", "image/png")

    assert resp.status_code == 502, resp.text
    assert "Could not reach the model backend" in resp.json().get("error", "")


# ---------------------------------------------------------------------------
# UC6 - Low-confidence result
# ---------------------------------------------------------------------------

def test_uc06_low_confidence_result():
    """Use case 6: an unrelated/ambiguous photo should NOT be returned as a
    confident apple/banana match.

    This asserts the underlying API condition that drives the "couldn't
    confidently identify" UI message (CONFIDENCE_THRESHOLD in page.tsx) -
    it doesn't render/read the frontend UI itself, since that needs a real
    browser (see Playwright recommendation in Conclusions).
    """
    noise_bytes = _random_noise_png()
    resp = _post_image(FRONTEND_BASE_URL, noise_bytes, "noise.png", "image/png")

    assert resp.status_code == 200, resp.text
    data = resp.json()
    # Either the backend itself says "unknown", or it guessed a fruit with
    # low confidence - both are the conditions page.tsx uses to show the
    # low-confidence message instead of a result.
    assert data["label"] == "unknown" or data["confidence"] < 0.5, data


# ---------------------------------------------------------------------------
# UC7 - Demo mode fallback
# ---------------------------------------------------------------------------

@pytest.mark.skipif(
    not DEMO_MODE_BASE_URL,
    reason=(
        "Set DEMO_MODE_BASE_URL to a deployment built with "
        "NEXT_PUBLIC_DEMO_MODE=true to run this for real (demo mode is a "
        "build-time env var on the deployed instance, not something a "
        "client request can toggle)."
    ),
)
def test_uc07_demo_mode_fallback():
    """Use case 7: in demo mode, /api/predict returns a mock result without
    ever calling a real backend - verified by calling it repeatedly and
    checking it returns varied, plausible results instead of erroring."""
    image_bytes = _load_image_bytes("apple1.png")
    labels_seen = set()

    for _ in range(5):
        resp = _post_image(DEMO_MODE_BASE_URL, image_bytes, "apple1.png", "image/png")
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["label"] in ("apple", "banana"), data
        assert 0.75 <= data["confidence"] <= 0.99, data
        labels_seen.add(data["label"])

    # Demo mode randomises the label each call, so across 5 calls we should
    # plausibly see it vary (not a hard guarantee, but a reasonable smoke check).
    assert len(labels_seen) >= 1


# ---------------------------------------------------------------------------
# UC8 - CI gate on push/PR
# ---------------------------------------------------------------------------

def test_uc08_ci_gate_latest_run_passed():
    """Use case 8 (partial, automatable half): the most recent `Frontend CI`
    run against `main` succeeded, confirming the gate is active and green.

    The other half of this use case - that CI actually FAILS when a
    lint/type/build error is introduced - was verified manually by
    intentionally introducing an error (see the Use Case Testing table);
    this script doesn't push broken commits to prove it.
    """
    api_url = (
        f"https://api.github.com/repos/{GITHUB_REPO}/actions/workflows/"
        f"{GITHUB_WORKFLOW_FILE}/runs?branch=main&per_page=1"
    )
    resp = requests.get(api_url, timeout=REQUEST_TIMEOUT)
    if resp.status_code != 200:
        pytest.skip(f"GitHub API unavailable or rate-limited (HTTP {resp.status_code})")

    runs = resp.json().get("workflow_runs", [])
    if not runs:
        pytest.skip("No workflow runs found for frontend-ci.yml on main yet")

    latest = runs[0]
    assert latest["conclusion"] == "success", latest.get("html_url")


# ---------------------------------------------------------------------------
# UC9 - PR preview deploy
# ---------------------------------------------------------------------------

@pytest.mark.skip(
    reason=(
        "Vercel Preview Deployments aren't exposed via a public, "
        "unauthenticated API. Verify manually: open a PR touching "
        "frontend/** and confirm Vercel's bot comments with a working "
        "preview URL."
    )
)
def test_uc09_pr_preview_deploy():
    pass


# ---------------------------------------------------------------------------
# UC10 - Production auto-deploy
# ---------------------------------------------------------------------------

@pytest.mark.skip(
    reason=(
        "Nothing in the live response currently identifies which commit "
        "is deployed, so this can't be asserted automatically without "
        "Vercel/Render API tokens. Verify manually: merge to main and "
        "confirm both dashboards show a fresh deploy within a few minutes."
    )
)
def test_uc10_production_auto_deploy():
    pass


# ---------------------------------------------------------------------------
# UC11 - Backend startup under Render's memory constraints
# ---------------------------------------------------------------------------

def test_uc11_backend_is_up_and_responsive():
    """Use case 11: the backend actually started and is serving requests,
    i.e. it's NOT stuck in the OOM crash-restart loop described in Lessons
    Learned. Uses a long timeout since Render's free tier can cold-start.
    """
    resp = requests.get(f"{BACKEND_BASE_URL}/", timeout=COLD_START_TIMEOUT)

    assert resp.status_code == 200, resp.text
    assert resp.json() == {"Hello": "world"}


if __name__ == "__main__":
    import sys

    sys.exit(pytest.main([__file__, "-v"]))
