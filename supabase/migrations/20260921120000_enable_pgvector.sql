-- Gate 0: enable pgvector only.
-- Do not add vector(N) columns or HNSW indexes here.
-- Dimension is verified later (docs + API + smoke) before content_embeddings is created.

create extension if not exists vector with schema extensions;
