-- =====================
-- NOCTRA SEO — Vitals Functions
-- =====================

create or replace function get_domain_vitals_p75(
  p_domain_id uuid,
  p_since timestamptz,
  p_until timestamptz
)
returns table (
  lcp numeric,
  cls numeric,
  inp numeric,
  sample_size bigint
) language plpgsql security definer as $$
begin
  return query
  select
    percentile_cont(0.75) within group (order by lcp_ms) as lcp,
    percentile_cont(0.75) within group (order by cls_score) as cls,
    percentile_cont(0.75) within group (order by inp_ms) as inp,
    count(*) as sample_size
  from web_vitals
  where domain_id = p_domain_id
    and measured_at >= p_since
    and measured_at < p_until;
end;
$$;
