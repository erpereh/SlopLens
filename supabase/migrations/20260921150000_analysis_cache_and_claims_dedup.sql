-- Analysis cache keys include decision provider + model (architecture review).
alter table public.content_analysis
  add column if not exists decision_provider_id text not null default 'jev',
  add column if not exists decision_model_id text not null default '';

alter table public.content_analysis
  drop constraint if exists content_analysis_content_item_id_key;

alter table public.content_analysis
  add constraint content_analysis_cache_key unique (
    content_item_id,
    decision_provider_id,
    decision_model_id
  );

-- Reuse persisted claims per content item + claim text when content is known.
create unique index if not exists claims_content_item_claim_text_key
  on public.claims (content_item_id, claim_text)
  where content_item_id is not null;
