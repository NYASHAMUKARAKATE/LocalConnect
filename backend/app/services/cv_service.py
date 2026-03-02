"""
Computer Vision Service for LocalConnect — Perceptual Hashing approach.

Uses perceptual hashing (pHash) and colour histograms to find visually
similar products.  No large model download required — runs on Pillow + numpy.

Google Gemini is used for AI-powered image tagging to enhance search
accuracy beyond pure visual fingerprinting.

Supported workflows:
  • Upload an image  → find visually similar products
  • Text search      → falls back to keyword matching (handled by the route)
"""

import io
import json
import logging
import os
import base64
import numpy as np
import requests
from PIL import Image
from typing import List, Optional, Tuple

from google import genai

logger = logging.getLogger(__name__)

def analyze_image_with_vision(image_bytes: bytes) -> Optional[str]:
    """
    Send image to Google Gemini to get a description/tags for visual search.
    Returns space-separated keywords describing the product in the image.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY not set, skipping Vision analysis.")
        return None

    try:
        client = genai.Client(api_key=api_key)

        # Open image with PIL — the new SDK auto-converts PIL Images
        img = Image.open(io.BytesIO(image_bytes))

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                "Describe this product in 3-5 keywords. Only return the keywords separated by spaces. Do not include any other text.",
                img,
            ],
        )

        tags = response.text.strip()
        logger.info(f"Gemini Vision analysis tags: {tags}")
        return tags
    except Exception as e:
        logger.error(f"Error calling Gemini Vision: {e}")
        return None

# ---------------------------------------------------------------------------
# Perceptual hash (pHash) — 64-bit hash using DCT
# ---------------------------------------------------------------------------

HASH_SIZE = 8           # 8×8 = 64-bit hash
HIGH_FREQ_FACTOR = 4    # resize to HASH_SIZE * factor before DCT


def _phash(img: Image.Image) -> np.ndarray:
    """
    Compute the perceptual hash of an image.

    1. Resize to 32×32 grayscale
    2. Apply a simple DCT-like transform (mean-based)
    3. Return a 64-element binary array
    """
    size = HASH_SIZE * HIGH_FREQ_FACTOR  # 32
    img = img.convert("L").resize((size, size), Image.LANCZOS)
    pixels = np.asarray(img, dtype=np.float64)

    # Simple DCT approximation: subtract row/col means
    # For each 8×8 block, compare to median
    # Downsample to HASH_SIZE × HASH_SIZE by averaging blocks
    block = HIGH_FREQ_FACTOR
    reduced = np.zeros((HASH_SIZE, HASH_SIZE))
    for i in range(HASH_SIZE):
        for j in range(HASH_SIZE):
            reduced[i, j] = pixels[
                i * block : (i + 1) * block,
                j * block : (j + 1) * block,
            ].mean()

    median = np.median(reduced)
    return (reduced > median).flatten().astype(np.uint8)


# ---------------------------------------------------------------------------
# Colour histogram — captures dominant colours
# ---------------------------------------------------------------------------

HIST_BINS = 16  # bins per channel → 48-element vector


def _colour_histogram(img: Image.Image) -> np.ndarray:
    """Return a normalised colour histogram (R, G, B channels)."""
    img = img.convert("RGB").resize((64, 64), Image.LANCZOS)
    arr = np.asarray(img)
    hists = []
    for ch in range(3):
        h, _ = np.histogram(arr[:, :, ch], bins=HIST_BINS, range=(0, 256))
        hists.append(h)
    vec = np.concatenate(hists).astype(np.float64)
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec /= norm
    return vec


# ---------------------------------------------------------------------------
# Combined fingerprint
# ---------------------------------------------------------------------------

def compute_fingerprint(img: Image.Image) -> dict:
    """
    Return a JSON-serialisable fingerprint dict with:
      • phash    – 64-element binary list
      • color_hist – 48-element float list
    """
    return {
        "phash": _phash(img).tolist(),
        "color_hist": _colour_histogram(img).tolist(),
    }


def fingerprint_from_url(url: str) -> Optional[dict]:
    """Download an image from *url* and return its fingerprint."""
    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        img = Image.open(io.BytesIO(resp.content)).convert("RGB")
        return compute_fingerprint(img)
    except Exception as e:
        logger.warning("Failed to fingerprint image from URL %s: %s", url, e)
        return None


def fingerprint_from_bytes(data: bytes) -> dict:
    """Return the fingerprint for raw image bytes (e.g. from an upload)."""
    img = Image.open(io.BytesIO(data)).convert("RGB")
    return compute_fingerprint(img)


# ---------------------------------------------------------------------------
# Similarity scoring
# ---------------------------------------------------------------------------

def similarity(fp_a: dict, fp_b: dict) -> float:
    """
    Compute similarity between two fingerprints (0.0 – 1.0).

    Combines:
      • Hamming similarity of perceptual hashes  (weight 0.6)
      • Cosine similarity of colour histograms   (weight 0.4)
    """
    # --- pHash hamming similarity ---
    h_a = np.asarray(fp_a["phash"], dtype=np.uint8)
    h_b = np.asarray(fp_b["phash"], dtype=np.uint8)
    hamming_dist = np.sum(h_a != h_b)
    hash_sim = 1.0 - (hamming_dist / len(h_a))

    # --- Colour histogram cosine similarity ---
    c_a = np.asarray(fp_a["color_hist"], dtype=np.float64)
    c_b = np.asarray(fp_b["color_hist"], dtype=np.float64)
    dot = np.dot(c_a, c_b)
    norm_a = np.linalg.norm(c_a)
    norm_b = np.linalg.norm(c_b)
    color_sim = dot / (norm_a * norm_b) if (norm_a > 0 and norm_b > 0) else 0.0

    # Weighted blend
    return 0.6 * hash_sim + 0.4 * color_sim


def find_most_similar(
    query_fingerprint: dict,
    candidates: list,  # list of (product_id, fingerprint_dict_or_json)
    top_k: int = 5,
) -> List[dict]:
    """
    Return the *top_k* most similar items from *candidates*.

    Each candidate is (product_id, fingerprint).
    Returns [{"product_id": int, "score": float}] sorted descending.
    """
    results = []
    for product_id, fp_data in candidates:
        if fp_data is None:
            continue
        fp = json.loads(fp_data) if isinstance(fp_data, str) else fp_data
        try:
            score = similarity(query_fingerprint, fp)
            results.append({"product_id": product_id, "score": score})
        except Exception as e:
            logger.warning("Error scoring product %s: %s", product_id, e)

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k]
