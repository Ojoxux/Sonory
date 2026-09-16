-- 検索系 RPC の PUBLIC への EXECUTE を剥がす

BEGIN;

REVOKE EXECUTE ON FUNCTION public.find_nearby_pins(
  double precision, double precision, integer, integer
) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.find_pins_within_bounds(
  double precision, double precision, double precision, double precision,
  integer, text[]
) FROM PUBLIC;

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260916053854', 'revoke_search_rpc_from_public')
ON CONFLICT (version) DO NOTHING;

COMMIT;
