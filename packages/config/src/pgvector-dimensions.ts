/**
 * Verified embedding column size for `public.content_embeddings.embedding`.
 * Keep Supabase migrations (`vector(N)` / `halfvec(N)`) aligned with this constant.
 * Changing model/dimension requires an explicit data migration — never mix vector spaces.
 */
export const PGVECTOR_EMBEDDING_DIMENSIONS = 2048;
