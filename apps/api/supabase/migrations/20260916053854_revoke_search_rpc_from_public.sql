-- 検索系 RPC の PUBLIC への EXECUTE を剥がす
--
-- CREATE FUNCTION が既定で付ける PUBLIC 付与が残っており、新しく作ったロールに
-- 自動でピンの読み取り権限が付いていた。SECURITY DEFINER なので呼び出し元の
-- テーブル権限では止まらず、EXECUTE を絞るのが唯一の制御点になる。
--
-- anon には明示的に付与済みのためアプリの動作は変わらない。

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
