-- =====================
-- NOCTRA SEO/GEO — Initial Schema
-- Fase 1
-- =====================

-- Habilitar extensiones necesarias
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";

-- =====================
-- MULTI-TENANT BASE
-- =====================

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  plan text default 'free' check (plan in ('free', 'starter', 'pro', 'agency')),
  seats_limit int default 1,
  pageviews_limit int default 10000,
  ai_context jsonb default '{}'::jsonb,
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table users (
  id uuid primary key references auth.users on delete cascade,
  org_id uuid references organizations(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  notification_prefs jsonb default '{
    "email": true,
    "push": false,
    "whatsapp": false,
    "slack": false,
    "critical_immediate": true,
    "digest_daily": true,
    "digest_time": "09:00",
    "whatsapp_number": null,
    "slack_webhook": null
  }'::jsonb,
  created_at timestamptz default now()
);

-- =====================
-- PROYECTOS Y DOMINIOS
-- =====================

create table projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  description text,
  created_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table domains (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  hostname text not null,
  site_id text unique not null default replace(gen_random_uuid()::text, '-', ''),
  gsc_property text,
  gsc_refresh_token_enc text,
  gsc_connected_at timestamptz,
  ahrefs_api_key_enc text,
  semrush_api_key_enc text,
  is_verified boolean default false,
  tracker_installed boolean default false,
  first_pageview_at timestamptz,
  last_pageview_at timestamptz,
  alert_thresholds jsonb default '{
    "lcp_warning_ms": 2500,
    "lcp_critical_ms": 4000,
    "cls_warning": 0.1,
    "cls_critical": 0.25,
    "inp_warning_ms": 200,
    "inp_critical_ms": 500,
    "seo_score_warning": 70,
    "seo_score_critical": 50,
    "bounce_rate_warning": 70,
    "position_drop_warning": 5
  }'::jsonb,
  created_at timestamptz default now(),
  unique(project_id, hostname)
);

-- =====================
-- DATOS DEL TRACKER
-- =====================

create table pageviews (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid references domains(id) on delete cascade,
  session_id text,
  path text not null,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  channel text check (channel in (
    'organic_search', 'direct', 'referral',
    'paid_search', 'paid_social', 'social', 'email', 'unknown'
  )),
  country text,
  city text,
  device_type text check (device_type in ('mobile', 'tablet', 'desktop')),
  screen_width int,
  language text,
  timezone text,
  time_on_page int,
  scroll_depth int,
  is_bounce boolean,
  visited_at timestamptz default now()
);

create index idx_pageviews_domain_visited on pageviews(domain_id, visited_at desc);
create index idx_pageviews_domain_path on pageviews(domain_id, path);
create index idx_pageviews_channel on pageviews(domain_id, channel, visited_at desc);

create table page_seo_signals (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid references domains(id) on delete cascade,
  path text not null,
  title text,
  title_length int generated always as (char_length(title)) stored,
  meta_description text,
  meta_description_length int generated always as (char_length(meta_description)) stored,
  h1 text,
  canonical_url text,
  robots_meta text,
  og_title text,
  og_description text,
  og_image text,
  schema_types text[],
  hreflang jsonb,
  word_count int,
  images_without_alt int default 0,
  internal_links int default 0,
  external_links int default 0,
  is_indexable boolean generated always as (
    robots_meta is null or robots_meta not ilike '%noindex%'
  ) stored,
  seo_score int default 0 check (seo_score between 0 and 100),
  issues jsonb default '[]'::jsonb,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  unique(domain_id, path)
);

create index idx_seo_signals_domain_score on page_seo_signals(domain_id, seo_score);

create table web_vitals (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid references domains(id) on delete cascade,
  path text not null,
  lcp_ms numeric,
  cls_score numeric,
  fid_ms numeric,
  inp_ms numeric,
  fcp_ms numeric,
  ttfb_ms numeric,
  device_type text,
  country text,
  measured_at timestamptz default now()
);

create index idx_web_vitals_domain_path on web_vitals(domain_id, path, measured_at desc);
create index idx_web_vitals_domain_date on web_vitals(domain_id, measured_at desc);

create materialized view page_vitals_p75 as
select
  domain_id,
  path,
  device_type,
  percentile_cont(0.75) within group (order by lcp_ms) as lcp_p75,
  percentile_cont(0.75) within group (order by cls_score) as cls_p75,
  percentile_cont(0.75) within group (order by inp_ms) as inp_p75,
  percentile_cont(0.75) within group (order by fcp_ms) as fcp_p75,
  percentile_cont(0.75) within group (order by ttfb_ms) as ttfb_p75,
  count(*) as sample_size,
  max(measured_at) as last_measured_at
from web_vitals
where measured_at > now() - interval '30 days'
group by domain_id, path, device_type;

create unique index on page_vitals_p75(domain_id, path, device_type);

select cron.schedule('refresh-vitals-p75', '0 * * * *', 'refresh materialized view concurrently page_vitals_p75');

-- =====================
-- ALERTAS
-- =====================

create table alerts (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid references domains(id) on delete cascade,
  type text not null,
  severity text not null check (severity in ('critical', 'warning', 'info')),
  status text default 'active' check (status in ('active', 'acknowledged', 'resolved')),
  affected_path text,
  metric_name text,
  metric_value numeric,
  metric_threshold numeric,
  metric_previous numeric,
  ai_analysis jsonb,
  ai_analysis_status text default 'pending' check (ai_analysis_status in ('pending', 'generated', 'failed')),
  notified_via jsonb default '[]'::jsonb,
  notified_at timestamptz,
  detected_at timestamptz default now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz
);

create index idx_alerts_domain_status on alerts(domain_id, status, detected_at desc);
create index idx_alerts_severity on alerts(domain_id, severity, status);

-- =====================
-- GSC + GEO
-- =====================

create table gsc_snapshots (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid references domains(id) on delete cascade,
  date date not null,
  path text,
  query text,
  clicks int,
  impressions int,
  ctr numeric,
  position numeric,
  device text,
  country text,
  unique(domain_id, date, path, query, device, country)
);

create table geo_checks (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid references domains(id) on delete cascade,
  query text not null,
  engine text not null check (engine in ('chatgpt', 'perplexity', 'gemini', 'copilot')),
  response_text text,
  domain_mentioned boolean,
  mention_position int,
  cited_url text,
  sentiment text check (sentiment in ('positive', 'neutral', 'negative')),
  checked_at timestamptz default now()
);

-- =====================
-- AUDITORÍAS
-- =====================

create table audit_jobs (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid references domains(id) on delete cascade,
  triggered_by uuid references users(id),
  status text default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  pages_audited int,
  issues_summary jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- =====================
-- RLS POLICIES
-- =====================

alter table organizations enable row level security;
alter table users enable row level security;
alter table projects enable row level security;
alter table domains enable row level security;
alter table pageviews enable row level security;
alter table page_seo_signals enable row level security;
alter table web_vitals enable row level security;
alter table alerts enable row level security;
alter table gsc_snapshots enable row level security;
alter table geo_checks enable row level security;
alter table audit_jobs enable row level security;

create or replace function current_user_org_id()
returns uuid language sql security definer as $$
  select org_id from users where id = auth.uid()
$$;

create policy "org_isolation" on organizations
  for all using (id = current_user_org_id());

create policy "org_isolation" on users
  for all using (org_id = current_user_org_id());

create policy "org_isolation" on projects
  for all using (org_id = current_user_org_id());

create policy "org_isolation" on domains
  for all using (
    project_id in (select id from projects where org_id = current_user_org_id())
  );

create policy "org_isolation" on pageviews
  for select using (
    domain_id in (
      select d.id from domains d
      join projects p on d.project_id = p.id
      where p.org_id = current_user_org_id()
    )
  );

create policy "tracker_insert" on pageviews
  for insert with check (true);

create policy "org_isolation" on page_seo_signals
  for select using (
    domain_id in (
      select d.id from domains d
      join projects p on d.project_id = p.id
      where p.org_id = current_user_org_id()
    )
  );

create policy "tracker_insert" on page_seo_signals
  for insert with check (true);

create policy "tracker_update" on page_seo_signals
  for update using (true);

create policy "org_isolation" on web_vitals
  for select using (
    domain_id in (
      select d.id from domains d
      join projects p on d.project_id = p.id
      where p.org_id = current_user_org_id()
    )
  );

create policy "tracker_insert" on web_vitals
  for insert with check (true);

create policy "org_isolation" on alerts
  for all using (
    domain_id in (
      select d.id from domains d
      join projects p on d.project_id = p.id
      where p.org_id = current_user_org_id()
    )
  );

create policy "org_isolation" on gsc_snapshots
  for all using (
    domain_id in (
      select d.id from domains d
      join projects p on d.project_id = p.id
      where p.org_id = current_user_org_id()
    )
  );

create policy "org_isolation" on geo_checks
  for all using (
    domain_id in (
      select d.id from domains d
      join projects p on d.project_id = p.id
      where p.org_id = current_user_org_id()
    )
  );

create policy "org_isolation" on audit_jobs
  for all using (
    domain_id in (
      select d.id from domains d
      join projects p on d.project_id = p.id
      where p.org_id = current_user_org_id()
    )
  );
