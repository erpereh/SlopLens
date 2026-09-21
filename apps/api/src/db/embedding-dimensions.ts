/**
 * Verified embedding column size for `public.content_embeddings.embedding`.
 * Smoke test against the bootstrap OpenRouter embedding model observed length 2048.
 * Changing model/dimension requires an explicit data migration — never mix vector spaces.
 */
export const PGVECTOR_EMBEDDING_DIMENSIONS = 2048;
