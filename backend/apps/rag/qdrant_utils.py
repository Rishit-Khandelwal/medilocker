import logging
from django.conf import settings

logger     = logging.getLogger(__name__)
COLLECTION = "medilocker_records"
_client    = None


def get_client():
    global _client
    if _client is None:
        from qdrant_client import QdrantClient
        _client = QdrantClient(
            host=getattr(settings, "QDRANT_HOST", "localhost"),
            port=getattr(settings, "QDRANT_PORT", 6333),
        )
    return _client


def ensure_collection():
    from qdrant_client import models as qm
    from .embeddings import VECTOR_SIZE
    client = get_client()
    if not client.collection_exists(COLLECTION):
        client.create_collection(
            collection_name=COLLECTION,
            vectors_config=qm.VectorParams(size=VECTOR_SIZE, distance=qm.Distance.COSINE),
        )
        logger.info(f"Created Qdrant collection '{COLLECTION}'.")


def upsert_chunks(points):
    """
    points: list of dicts with keys id (UUID str), vector (list[float]), payload (dict)
    """
    from qdrant_client import models as qm
    client = get_client()
    ensure_collection()
    qdrant_points = [
        qm.PointStruct(id=p["id"], vector=p["vector"], payload=p["payload"])
        for p in points
    ]
    client.upsert(collection_name=COLLECTION, points=qdrant_points)


def delete_record_chunks(record_id):
    """Remove all Qdrant points for a given record_id."""
    from qdrant_client import models as qm
    client = get_client()
    try:
        ensure_collection()
        client.delete(
            collection_name=COLLECTION,
            points_selector=qm.FilterSelector(
                filter=qm.Filter(
                    must=[qm.FieldCondition(
                        key="record_id",
                        match=qm.MatchValue(value=record_id),
                    )]
                )
            ),
        )
    except Exception as exc:
        logger.warning(f"Qdrant delete failed for record {record_id}: {exc}")


def search_chunks(query_vector, user_id, limit=5):
    """Cosine-similarity search filtered to the requesting user's records."""
    from qdrant_client import models as qm
    client = get_client()
    try:
        ensure_collection()
        return client.search(
            collection_name=COLLECTION,
            query_vector=query_vector,
            query_filter=qm.Filter(
                must=[qm.FieldCondition(
                    key="user_id",
                    match=qm.MatchValue(value=user_id),
                )]
            ),
            limit=limit,
            with_payload=True,
        )
    except Exception as exc:
        logger.error(f"Qdrant search failed: {exc}")
        return []