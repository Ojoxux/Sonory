-- 20260912071028 / 20260912071029 の適用結果を検証する（読み取り専用）
--
-- 期待値:
--   A. RLSポリシー   4件。Public pins(SELECT/public) +
--                    Users can insert|update|delete their own pins(authenticated)
--   B. create_sound_pin  security_definer=f（INVOKER化の成否。今回の最重要項目）
--   C. 外部キー       fk_sound_pins_user_id が auth.users(id) を ON DELETE SET NULL で参照
--   D. 適用履歴       20260607000001 / 20260912071028 / 20260912071029 が登録済み
--   E. 孤児ピン       user_id IS NULL のピンが残っていること（FK 追加で壊れていない確認）

WITH
pols AS (
  SELECT 'A. RLSポリシー' AS section, policyname AS sort_key, policyname AS item,
    format('cmd=%s roles=%s check=%s', cmd, array_to_string(roles, '+'),
           coalesce(with_check, '-')) AS detail
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'sound_pins'
),
fns AS (
  SELECT 'B. 関数のSECURITY属性' AS section, p.proname AS sort_key, p.proname AS item,
    format('security_definer=%s config=%s', p.prosecdef,
           coalesce(array_to_string(p.proconfig, ','), '(未設定)')) AS detail
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN ('create_sound_pin', 'find_nearby_pins', 'find_pins_within_bounds')
),
fks AS (
  SELECT 'C. 外部キー' AS section, con.conname AS sort_key, con.conname AS item,
    pg_get_constraintdef(con.oid) AS detail
  FROM pg_constraint con
  WHERE con.conrelid = 'public.sound_pins'::regclass AND con.contype = 'f'
),
hist AS (
  SELECT 'D. 適用履歴' AS section, version AS sort_key, version AS item,
    coalesce(name, '-') AS detail
  FROM supabase_migrations.schema_migrations
),
rls_on_hist AS (
  SELECT 'D. 適用履歴' AS section, 'zz_rls' AS sort_key,
    'schema_migrations の RLS' AS item,
    format('rowsecurity=%s (false が期待値)', relrowsecurity) AS detail
  FROM pg_class
  WHERE oid = 'supabase_migrations.schema_migrations'::regclass
),
pins AS (
  SELECT 'E. データ' AS section, 'sound_pins' AS sort_key, 'sound_pins' AS item,
    format('total=%s orphan=%s owned=%s', count(*),
      count(*) FILTER (WHERE user_id IS NULL),
      count(*) FILTER (WHERE user_id IS NOT NULL)) AS detail
  FROM public.sound_pins
)

SELECT section, item, detail FROM (
  SELECT 1 AS ord, * FROM pols
  UNION ALL SELECT 2, * FROM fns
  UNION ALL SELECT 3, * FROM fks
  UNION ALL SELECT 4, * FROM hist
  UNION ALL SELECT 4, * FROM rls_on_hist
  UNION ALL SELECT 5, * FROM pins
) t
ORDER BY ord, sort_key;
