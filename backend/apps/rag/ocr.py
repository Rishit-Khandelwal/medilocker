import io
import logging
import re

logger = logging.getLogger(__name__)

# ── Availability guards ────────────────────────────────────────────────────────
try:
    import fitz          # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False
    logger.warning("PyMuPDF not installed — PDF processing will be skipped.")

try:
    import pytesseract
    from PIL import Image
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    logger.warning("pytesseract / Pillow not installed — OCR fallback disabled.")


def _configure_tesseract():
    """Apply TESSERACT_CMD from Django settings if provided."""
    if not TESSERACT_AVAILABLE:
        return
    try:
        from django.conf import settings
        cmd = getattr(settings, "TESSERACT_CMD", "")
        if cmd:
            pytesseract.pytesseract.tesseract_cmd = cmd
    except Exception:
        pass


_configure_tesseract()


# ── Extractors ─────────────────────────────────────────────────────────────────

def _ocr_image_object(pil_image):
    """Run Tesseract on a PIL Image. Returns empty string if unavailable."""
    if not TESSERACT_AVAILABLE:
        return ""
    try:
        if pil_image.mode not in ("RGB", "L"):
            pil_image = pil_image.convert("RGB")
        return pytesseract.image_to_string(pil_image, lang="eng")
    except Exception as exc:
        logger.warning(f"Tesseract failed: {exc}")
        return ""


def extract_text_from_pdf(file_path):
    """
    For each page:
      1. Try PyMuPDF direct text extraction (works for digital PDFs, fast).
      2. If the extracted text is too short (<50 chars), render the page at
         300 DPI and run Tesseract OCR (handles scanned pages).

    Returns (text: str, method: str).
    """
    if not PYMUPDF_AVAILABLE:
        return "", "skipped"
    try:
        doc = fitz.open(file_path)
        pages_text = []
        used_ocr   = False

        for page in doc:
            text = page.get_text("text").strip()

            if len(text) < 50:      # scanned or image-only page
                if TESSERACT_AVAILABLE:
                    pix = page.get_pixmap(dpi=300)
                    img = Image.open(io.BytesIO(pix.tobytes("png")))
                    text = _ocr_image_object(img)
                    used_ocr = True

            if text.strip():
                pages_text.append(text)

        doc.close()
        full_text = "\n\n".join(pages_text)
        method    = "tesseract" if used_ocr else "direct"
        return full_text, method

    except Exception as exc:
        logger.error(f"PDF extraction failed for {file_path}: {exc}")
        return "", "failed"


def extract_text_from_image(file_path):
    """Run Tesseract on a PNG/JPEG file."""
    if not TESSERACT_AVAILABLE:
        return "", "skipped"
    try:
        from PIL import Image as PILImage
        img  = PILImage.open(file_path)
        text = _ocr_image_object(img)
        return text, "tesseract"
    except Exception as exc:
        logger.error(f"Image OCR failed for {file_path}: {exc}")
        return "", "failed"


def extract_text(file_path, mime_type):
    """Route to the appropriate extractor. Returns (text, method)."""
    if mime_type == "application/pdf":
        return extract_text_from_pdf(file_path)
    if mime_type in ("image/png", "image/jpeg", "image/jpg"):
        return extract_text_from_image(file_path)
    return "", "unsupported"


# ── Chunking ───────────────────────────────────────────────────────────────────

def chunk_text(text, chunk_words=200, overlap_words=40):
    """
    Word-based sliding-window chunking.
    Returns a list of non-trivial chunk strings.
    """
    if not text or not text.strip():
        return []

    # Normalise whitespace
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r" {2,}",  " ",    text)

    words = text.split()
    if not words:
        return []

    chunks = []
    start  = 0

    while start < len(words):
        end   = min(start + chunk_words, len(words))
        chunk = " ".join(words[start:end]).strip()
        if len(chunk) >= 30:     # skip near-empty chunks
            chunks.append(chunk)
        if end >= len(words):
            break
        start = end - overlap_words

    return chunks