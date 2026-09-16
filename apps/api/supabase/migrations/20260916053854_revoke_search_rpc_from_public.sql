-- 検索系 RPC の PUBLIC への EXECUTE を剥がす
--
-- PostgreSQL は CREATE FUNCTION 時に EXECUTE を PUBLIC へ既定で付与する。
-- create_sound_pin とキュー操作は REVOKE ... FROM PUBLIC していたが、
-- 検索系2本だけ漏れており、ACL が `=X/postgres` のまま残っていた。
--
-- anon には明示的に付与しているので、この REVOKE でアプリの動作は変わらない
-- （未ログインのゲストが地図を見る経路はそのまま）。
--
-- 実害があったわけではない。これらは status = 'active' の行しか返さず、
-- user_id も 20260912113306 で戻り値から除いてある。
-- 問題は、PUBLIC への付与が残っていると**今後作るどのロールにも自動で
-- ピンの読み取り権限が付く**こと。CI 用の読み取り専用ロール
-- （20260916052801）を作った際に、意図せずピンを読めることが分かった。
--
-- 関数は SECURITY DEFINER なので、呼び出し元のテーブル権限では止められない。
-- EXECUTE を絞るのが唯一の制御点になる。

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

-- 適用後の確認:
--
--   SELECT p.proname, p.proacl
--   FROM pg_proc p
--   WHERE p.proname IN ('find_nearby_pins', 'find_pins_within_bounds');
--
-- 先頭の `=X/postgres`（PUBLIC への付与）が消え、anon / authenticated /
-- service_role への付与だけが残ること。
--
--   SELECT has_function_privilege('ci_migration_check', p.oid, 'EXECUTE')
--   FROM pg_proc p WHERE p.proname = 'find_nearby_pins';
--
-- false になること。anon は true のままであること。
