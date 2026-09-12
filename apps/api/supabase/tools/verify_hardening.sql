-- 013_harden_public_access.sql の適用結果を検証する（読み取り専用）
--
-- 期待値:
--   1. create_sound_pin / queue_* の anon が false
--      （create_sound_pin の authenticated は true のまま = Phase 5 で使うため）
--   2. sonory-audio バケットが public=false、サイズ上限とMIME制限が復活
--   3. analysis_results のポリシーが 0 件（= 既定拒否）
--      storage.objects / storage.buckets の "Anyone can ..." が消えている
--   4. anon の analysis_results 権限が 0 件、sound_pins は SELECT のみ

WITH
fn_grants AS (
  SELECT
    '1. 関数のEXECUTE権限' AS section,
    p.proname AS sort_key,
    p.proname AS item,
    format('anon=%s authenticated=%s service_role=%s',
      has_function_privilege('anon', p.oid, 'EXECUTE'),
      has_function_privilege('authenticated', p.oid, 'EXECUTE'),
      has_function_privilege('service_role', p.oid, 'EXECUTE')
    ) AS detail
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'create_sound_pin', 'queue_send', 'queue_read', 'queue_delete',
      'find_nearby_pins', 'find_pins_within_bounds'
    )
),

fn_config AS (
  SELECT
    '2. 関数のsearch_path' AS section,
    p.proname AS sort_key,
    p.proname AS item,
    format('security_definer=%s config=%s',
      p.prosecdef,
      coalesce(array_to_string(p.proconfig, ','), '(未設定)')) AS detail
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN ('queue_send', 'queue_read', 'queue_delete', 'create_sound_pin')
),

bucket AS (
  SELECT
    '3. Storageバケット' AS section,
    id AS sort_key,
    id AS item,
    format('public=%s size_limit=%s mime=%s',
      public,
      coalesce(file_size_limit::text, '(未設定)'),
      coalesce(array_to_string(allowed_mime_types, ','), '(未設定)')) AS detail
  FROM storage.buckets
  WHERE id = 'sonory-audio'
),

pols AS (
  SELECT
    '4. 残存ポリシー' AS section,
    format('%s.%s.%s', schemaname, tablename, policyname) AS sort_key,
    format('%s.%s / %s', schemaname, tablename, policyname) AS item,
    format('cmd=%s roles=%s', cmd, array_to_string(roles, '+')) AS detail
  FROM pg_policies
  WHERE (schemaname = 'public' AND tablename IN ('analysis_results', 'sound_pins'))
     OR (schemaname = 'storage' AND tablename IN ('objects', 'buckets'))
),

tbl_grants AS (
  SELECT
    '5. テーブル権限' AS section,
    format('%s.%s', table_name, grantee) AS sort_key,
    format('%-18s %s', table_name, grantee) AS item,
    string_agg(privilege_type, ',' ORDER BY privilege_type) AS detail
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND table_name IN ('sound_pins', 'analysis_results')
    AND grantee IN ('anon', 'authenticated', 'service_role', 'PUBLIC')
  GROUP BY table_name, grantee
)

SELECT section, item, detail FROM (
  SELECT 1 AS ord, section, sort_key, item, detail FROM fn_grants
  UNION ALL SELECT 2, section, sort_key, item, detail FROM fn_config
  UNION ALL SELECT 3, section, sort_key, item, detail FROM bucket
  UNION ALL SELECT 4, section, sort_key, item, detail FROM pols
  UNION ALL SELECT 5, section, sort_key, item, detail FROM tbl_grants
) t
ORDER BY ord, sort_key;
