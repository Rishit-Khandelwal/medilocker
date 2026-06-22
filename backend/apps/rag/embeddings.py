import logging

logger  = logging.getLogger(__name__)
_model  = None

# Model: BAAI/bge-small-en-v1.5
# ~130 MB, downloaded once to ~/.cache/fastembed/
# Runs locally via ONNX — no GPU, no API key required.
EMBED_MODEL = "BAAI/bge-small-en-v1.5"
VECTOR_SIZE = 384


def get_embedder():
    """Lazy singleton — model loads on first call, then stays in memory."""
    global _model
    if _model is None:
        try:
            from fastembed import TextEmbedding
            logger.info(f"Loading embedding model {EMBED_MODEL}…")
            _model = TextEmbedding(model_name=EMBED_MODEL)
            logger.info("Embedding model ready.")
        except Exception as exc:
            logger.error(f"Failed to load embedding model: {exc}")
            raise
    return _model


def embed_texts(texts):
    """
    Returns a list of float lists (one per input text).
    Raises if the model is unavailable.
    """
    model = get_embedder()
    return [v.tolist() for v in model.embed(texts)]