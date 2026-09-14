-- 実DBの現状確認（読み取り専用・適用系の操作は一切しない）
--
-- Supabase の SQL Editor は複数ステートメントを実行しても最後の結果しか返さないため、
-- 全項目を1つの結果セットに畳んである。そのまま貼り付けて実行し、出力全体を控えること。
--
-- 目的: apps/api/sql/*.sql と実DBの乖離を把握する。
-- 特に 011/012 を適用する前に「A. RLSポリシー」を必ず確認すること。
-- ポリシー名が 011 の DROP 対象と違うと DROP POLICY IF EXISTS が黙って no-op になり、
-- 緩いポリシーが残ったまま新ポリシーが追加される。RLS は複数ポリシーを OR で
-- 評価するため、auth.uid() ベースのポリシーを足しても素通りしてしまう。
--
-- 判明済み: supabase_migrations.schema_migrations は存在しない。
--   → Supabase CLI 経由でマイグレーションを適用した履歴は一度も無い。
--   → 実DBの状態は apps/api/sql/*.sql の手動実行と SQL Editor 直叩きの積み重ね。

WITH
-- A. sound_pins の RLS ポリシー（011 の DROP 対象名と一致するか）
policies AS (
  SELECT
    'A. RLSポリシー' AS section,
    policyname AS item,
    format(
      'cmd=%s roles=%s using=%s check=%s',
      cmd,
      array_to_string(roles, '+'),
      coalesce(qual, '-'),
      coalesce(with_check, '-')
    ) AS detail
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'sound_pins'
),

-- B. RLS 自体が有効か
rls_flag AS (
  SELECT
    'B. RLS有効' AS section,
    relname AS item,
    format('rowsecurity=%s forced=%s', relrowsecurity, relforcerowsecurity) AS detail
  FROM pg_class
  WHERE oid = 'public.sound_pins'::regclass
),

-- C. 関数が SECURITY DEFINER か / search_path が固定されているか
--    （012 を流す前の実状態。proconfig に search_path=public があれば固定済み）
functions AS (
  SELECT
    'C. 関数の定義' AS section,
    p.proname AS item,
    format(
      'security_definer=%s config=%s',
      p.prosecdef,
      coalesce(array_to_string(p.proconfig, ','), '(未設定)')
    ) AS detail
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'create_sound_pin', 'find_nearby_pins',
      'find_pins_within_bounds', 'find_nearby_pins_by_ids'
    )
),

-- D. 関数の EXECUTE 権限（anon に付いていると直接呼ばれうる）
grants AS (
  SELECT
    'D. 関数のEXECUTE権限' AS section,
    p.proname AS item,
    string_agg(
      r.rolname || '=' || has_function_privilege(r.rolname, p.oid, 'EXECUTE')::text,
      ' '
      ORDER BY r.rolname
    ) AS detail
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  CROSS JOIN (
    SELECT rolname FROM pg_roles
    WHERE rolname IN ('anon', 'authenticated', 'service_role')
  ) r
  WHERE n.nspname = 'public'
    AND p.proname IN ('create_sound_pin', 'find_nearby_pins', 'find_pins_within_bounds')
  GROUP BY p.proname
),

-- E. user_id 列の型（巻き戻しで UUID NULL 許可に戻っているか）
columns_info AS (
  SELECT
    'E. user_id列' AS section,
    column_name AS item,
    format('type=%s nullable=%s default=%s',
      data_type, is_nullable, coalesce(column_default, '-')) AS detail
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'sound_pins'
    AND column_name = 'user_id'
),

-- F. 外部キー制約の残骸（fk_sound_pins_user_id が無いこと）
fks AS (
  SELECT
    'F. 外部キー' AS section,
    conname AS item,
    'sound_pins に残存' AS detail
  FROM pg_constraint
  WHERE conrelid = 'public.sound_pins'::regclass AND contype = 'f'
),

-- G. データ件数と孤児ピンの実数
--    20260607 の巻き戻しで TRUNCATE 済みなら 0 件になる
counts AS (
  SELECT
    'G. データ件数' AS section,
    'sound_pins' AS item,
    format('total=%s orphan(user_id IS NULL)=%s owned=%s',
      count(*),
      count(*) FILTER (WHERE user_id IS NULL),
      count(*) FILTER (WHERE user_id IS NOT NULL)) AS detail
  FROM public.sound_pins
)

SELECT section, item, detail FROM (
  SELECT 1 AS ord, * FROM policies
  UNION ALL SELECT 2, * FROM rls_flag
  UNION ALL SELECT 3, * FROM functions
  UNION ALL SELECT 4, * FROM grants
  UNION ALL SELECT 5, * FROM columns_info
  UNION ALL SELECT 6, * FROM fks
  UNION ALL SELECT 7, * FROM counts
) t
ORDER BY ord, item;
