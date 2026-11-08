"""
Frontend UI test cases (browser-driven).

Covers the 4 frontend/UI-level test cases documented in the report:

    Test Case 8  - Displaying the results of identifying apple/banana images
    Test Case 9  - Unsupported file type
    Test Case 10 - Oversized file
    Test Case 11 - Low-confidence result

Unlike tests/test_use_cases_section_a.py (which hits the HTTP API directly
with `requests`), these tests drive a REAL BROWSER with Playwright. That's
necessary because Test Cases 9, 10, and 11's expected messages are produced
entirely client-side in frontend/app/page.tsx:
  - Test Cases 9 & 10: validated in ImageUploader.checkAndPick() the instant
    a file is picked - the file never leaves the browser, so there's no
    network request to intercept with a plain HTTP test.
  - Test Case 11: rendered by ResultPanel based on the API's response, but
    the exact wording only exists in the rendered DOM, not the JSON itself.

Setup
-----
    pip install playwright pytest-playwright
    playwright install chromium

Usage
-----
    pytest tests/test_frontend.py -v
    # or simply:
    python tests/test_frontend.py

Point this at whichever deployment you want to test (defaults to the live
production site):

    # Windows (PowerShell)
    $env:FRONTEND_BASE_URL = "https://boboiboy-project.vercel.app"

    # macOS / Linux
    export FRONTEND_BASE_URL="https://boboiboy-project.vercel.app"
"""

from __future__ import annotations

import io
import os
import random
from pathlib import Path

import pytest
from playwright.sync_api import Page, expect

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

FRONTEND_BASE_URL = os.environ.get(
    "FRONTEND_BASE_URL", "https://boboiboy-project.vercel.app"
).rstrip("/")

TEST_IMAGES_DIR = Path(__file__).resolve().parents[1] / "backend" / "tests" / "images"

PAGE_LOAD_TIMEOUT_MS = 30_000
PREDICTION_TIMEOUT_MS = 90_000  # Render free-tier cold start can be slow


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _image_bytes(filename: str) -> bytes:
    path = TEST_IMAGES_DIR / filename
    if not path.is_file():
        pytest.skip(f"Test fixture image not found: {path}")
    return path.read_bytes()


def _random_noise_png_bytes(width: int = 64, height: int = 64) -> bytes:
    """A synthetic "doesn't look like an apple or banana" image, used for
    Test Case 11 without depending on a specific third-class photo that
    doesn't exist in the repo's fixtures."""
    from PIL import Image

    pixels = bytes(random.getrandbits(8) for _ in range(width * height * 3))
    img = Image.frombytes("RGB", (width, height), pixels)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _upload(page: Page, filename: str, mime_type: str, content: bytes) -> None:
    """Sets a file on the page's (hidden) file input the same way choosing
    a file via the "Choose photo" button would - without needing a real
    file on disk. Playwright fires a real change event, so React's
    onChange -> checkAndPick() runs exactly as it would for a real user.
    """
    file_input = page.locator('input[type="file"]')
    file_input.set_input_files(
        {"name": filename, "mimeType": mime_type, "buffer": content}
    )


@pytest.fixture
def page_at_app(page: Page) -> Page:
    page.goto(FRONTEND_BASE_URL, timeout=PAGE_LOAD_TIMEOUT_MS)
    expect(
        page.get_by_role("heading", name="BoBoiBoy's Fruit Identifier")
    ).to_be_visible(timeout=PAGE_LOAD_TIMEOUT_MS)
    return page


# ---------------------------------------------------------------------------
# Test Case 8 - Displaying the results of identifying apple/banana images
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "filename,mime_type,expected_heading",
    [
        ("apple1.png", "image/png", "Identified as Apple"),
        ("banana1.png", "image/png", "Identified as Banana"),
    ],
)
def test_case_08_display_identification_results(
    page_at_app, filename, mime_type, expected_heading
):
    """Objective: displaying the results of identifying apple/banana images.
    Input: apple1.png / banana1.png.
    Expected result: show correct classification and results fields -
    label, confidence bar, and the fruit info card (nutrition, health
    benefits, ripeness tips, usage ideas).
    """
    page = page_at_app
    _upload(page, filename, mime_type, _image_bytes(filename))

    page.get_by_role("button", name="Identify fruit").click()

    expect(page.get_by_text(expected_heading)).to_be_visible(timeout=PREDICTION_TIMEOUT_MS)
    # .first: a banana result legitimately shows "Model confidence" twice
    # (once for the fruit label, once for ripeness) - either is fine here.
    expect(page.get_by_text("Model confidence").first).to_be_visible()
    # Section titles are real <h3> headings - using the heading role avoids
    # accidentally matching the intro paragraph, which happens to mention
    # "health benefits" in lowercase body text too.
    expect(page.get_by_role("heading", name="Nutrition (approx. per serving)")).to_be_visible()
    expect(page.get_by_role("heading", name="Health benefits")).to_be_visible()
    expect(page.get_by_role("heading", name="Ways to enjoy it")).to_be_visible()


# ---------------------------------------------------------------------------
# Test Case 9 - Unsupported file type
# ---------------------------------------------------------------------------

def test_case_09_unsupported_file_type(page_at_app):
    """Objective: test unsupported file type.
    Input: a PDF file.
    Expected result: "Please choose a JPEG, PNG, or WEBP image."
    """
    page = page_at_app
    fake_pdf_bytes = b"%PDF-1.4 not a real pdf, just the wrong content type"
    _upload(page, "document.pdf", "application/pdf", fake_pdf_bytes)

    expect(
        page.get_by_text("Please choose a JPEG, PNG, or WEBP image.")
    ).to_be_visible()


# ---------------------------------------------------------------------------
# Test Case 10 - Oversized file
# ---------------------------------------------------------------------------

def test_case_10_oversized_file(page_at_app):
    """Objective: test oversized file type.
    Input: a 9 MB PNG file.
    Expected result: "That image is too large - please pick one under 8 MB."
    """
    page = page_at_app
    oversized_bytes = os.urandom(9 * 1024 * 1024)  # 9 MB > the 8 MB limit
    _upload(page, "huge.png", "image/png", oversized_bytes)

    expect(
        page.get_by_text("That image is too large - please pick one under 8 MB.")
    ).to_be_visible()


# ---------------------------------------------------------------------------
# Test Case 11 - Low-confidence result
# ---------------------------------------------------------------------------

def test_case_11_low_confidence_result(page_at_app):
    """Objective: show the results when a low confidence is produced.
    Input: a non-apple/non-banana image (synthetic random noise, since no
    such fixture image exists in the repo's test images).
    Expected result: "Couldn't confidently identify an apple or banana.
    Try a clearer, well-lit photo with the fruit centred and filling most
    of the frame." shown in the result panel.
    """
    page = page_at_app
    _upload(page, "noise.png", "image/png", _random_noise_png_bytes())

    page.get_by_role("button", name="Identify fruit").click()

    expect(
        page.get_by_text("Couldn't confidently identify an apple or banana")
    ).to_be_visible(timeout=PREDICTION_TIMEOUT_MS)
    expect(
        page.get_by_text(
            "Try a clearer, well-lit photo with the fruit centred and filling most of the frame."
        )
    ).to_be_visible()


if __name__ == "__main__":
    import sys

    sys.exit(pytest.main([__file__, "-v"]))
