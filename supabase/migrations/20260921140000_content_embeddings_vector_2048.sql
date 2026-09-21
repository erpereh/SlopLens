-- G1b: content_embeddings with verified dimension N=2048.
-- Must match `PGVECTOR_EMBEDDING_DIMENSIONS` in `@sloplens/config` (2048 today).
-- Observed by the embedding smoke test: embedding.values.length === that constant.
-- pgvector HNSW on `vector` maxes at 2000 dims, so the index uses a halfvec cast.

create table if not exists public.content_embeddings (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items (id) on delete cascade,
  model_id text not null,
  dim integer not null,
  embedding extensions.vector(2048) not null,
  created_at timestamptz not null default now(),
  constraint content_embeddings_content_item_model_key unique (content_item_id, model_id),
  constraint content_embeddings_dim_positive check (dim > 0)
);

create index if not exists content_embeddings_hnsw_halfvec_idx
  on public.content_embeddings
  using hnsw ((embedding::extensions.halfvec(2048)) halfvec_cosine_ops);

create table if not exists public.clusters (
  id uuid primary key default gen_random_uuid(),
  label text,
  created_at timestamptz not null default now()
);

create table if not exists public.cluster_members (
  cluster_id uuid not null references public.clusters (id) on delete cascade,
  content_item_id uuid not null references public.content_items (id) on delete cascade,
  primary key (cluster_id, content_item_id)
);
