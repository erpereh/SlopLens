-- Foundation: domain tables without vector(N) columns or HNSW indexes.

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  external_id text,
  url text not null,
  author text,
  title text,
  body text,
  published_at timestamptz,
  captured_at timestamptz not null default now(),
  language text,
  content_type text,
  metadata jsonb not null default '{}'::jsonb,
  content_hash text not null,
  constraint content_items_content_hash_key unique (content_hash)
);

create index if not exists content_items_platform_external_id_idx
  on public.content_items (platform, external_id)
  where external_id is not null;

create table if not exists public.content_analysis (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items (id) on delete cascade,
  decision jsonb not null,
  analyzed_at timestamptz not null default now(),
  constraint content_analysis_content_item_id_key unique (content_item_id)
);

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid references public.content_items (id) on delete set null,
  claim_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  title text,
  publisher text,
  kind text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint sources_url_key unique (url)
);

create table if not exists public.content_relations (
  id uuid primary key default gen_random_uuid(),
  from_content_id uuid not null references public.content_items (id) on delete cascade,
  to_content_id uuid references public.content_items (id) on delete set null,
  to_url text,
  relation_type text not null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint content_relations_target_check check (
    to_content_id is not null or to_url is not null
  )
);

create index if not exists content_relations_from_content_id_idx
  on public.content_relations (from_content_id);

create table if not exists public.provider_selections (
  capability text not null,
  provider_id text not null,
  model_id text,
  base_url text,
  options jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (capability)
);
