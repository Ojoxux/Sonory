-- 実DBのスキーマを吸い出す（読み取り専用）
--
-- 用途: リベースライン用。リポジトリに存在しない analysis_results の構造と、
--       sound_pins の実際の列構成（ai_analysis_result を含む）を確定させる。
--
-- Supabase の SQL Editor は最後の結果しか返さないため1クエリに畳んである。
-- 出力が長い場合は右上のダウンロードから CSV で落として渡してもよい。

WITH
-- 列定義
cols AS (
  SELECT
    '1. 列定義' AS section,
    format('%s.%s', c.table_name, lpad(c.ordinal_position::text, 2, '0')) AS sort_key,
    format('%-18s %-12s', c.table_name, c.column_name) AS item,
    format('%s%s%s%s',
      c.data_type,
      CASE WHEN c.character_maximum_length IS NOT NULL
           THEN '(' || c.character_maximum_length || ')' ELSE '' END,
      CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
      CASE WHEN c.column_default IS NOT NULL
           THEN ' DEFAULT ' || c.column_default ELSE '' END
    ) AS detail
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name IN ('sound_pins', 'analysis_results')
),

-- 制約（PK / FK / UNIQUE / CHECK）
constraints AS (
  SELECT
    '2. 制約' AS section,
    format('%s.%s', rel.relname, con.conname) AS sort_key,
    format('%-18s %s', rel.relname, con.conname) AS item,
    format('%s | %s',
      CASE con.contype
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'c' THEN 'CHECK'
        ELSE con.contype::text
      END,
      pg_get_constraintdef(con.oid)
    ) AS detail
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace n ON n.oid = rel.relnamespace
  WHERE n.nspname = 'public'
    AND rel.relname IN ('sound_pins', 'analysis_results')
),

-- インデックス
indexes AS (
  SELECT
    '3. インデックス' AS section,
    format('%s.%s', tablename, indexname) AS sort_key,
    format('%-18s %s', tablename, indexname) AS item,
    indexdef AS detail
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename IN ('sound_pins', 'analysis_results')
),

-- テーブルへの権限（anon に想定外の書き込み権限が無いか）
table_grants AS (
  SELECT
    '4. テーブル権限' AS section,
    format('%s.%s', table_name, grantee) AS sort_key,
    format('%-18s %s', table_name, grantee) AS item,
    string_agg(privilege_type, ',' ORDER BY privilege_type) AS detail
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND table_name IN ('sound_pins', 'analysis_results')
    AND grantee IN ('anon', 'authenticated', 'service_role', 'PUBLIC')
  GROUP BY table_name, grantee
),

-- analysis_results の RLS ポリシー（sound_pins 側は確認済み）
ar_policies AS (
  SELECT
    '5. analysis_results のRLS' AS section,
    policyname AS sort_key,
    policyname AS item,
    format('cmd=%s roles=%s using=%s check=%s',
      cmd, array_to_string(roles, '+'),
      coalesce(qual, '-'), coalesce(with_check, '-')) AS detail
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'analysis_results'
),

-- RLS 有効フラグ
rls_flags AS (
  SELECT
    '6. RLS有効' AS section,
    relname AS sort_key,
    relname AS item,
    format('rowsecurity=%s', relrowsecurity) AS detail
  FROM pg_class
  WHERE relnamespace = 'public'::regnamespace
    AND relname IN ('sound_pins', 'analysis_results')
),

-- キュー関連オブジェクト（pgmq）の有無
queue_objs AS (
  SELECT
    '7. キュー関連' AS section,
    p.proname AS sort_key,
    p.proname AS item,
    format('args=(%s)', pg_get_function_identity_arguments(p.oid)) AS detail
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE p.proname IN ('queue_send', 'queue_read', 'queue_delete')
),

-- インストール済み拡張
exts AS (
  SELECT
    '8. 拡張' AS section,
    extname AS sort_key,
    extname AS item,
    extversion AS detail
  FROM pg_extension
)

SELECT section, item, detail FROM (
  SELECT 1 AS ord, section, sort_key, item, detail FROM cols
  UNION ALL SELECT 2, section, sort_key, item, detail FROM constraints
  UNION ALL SELECT 3, section, sort_key, item, detail FROM indexes
  UNION ALL SELECT 4, section, sort_key, item, detail FROM table_grants
  UNION ALL SELECT 5, section, sort_key, item, detail FROM ar_policies
  UNION ALL SELECT 6, section, sort_key, item, detail FROM rls_flags
  UNION ALL SELECT 7, section, sort_key, item, detail FROM queue_objs
  UNION ALL SELECT 8, section, sort_key, item, detail FROM exts
) t
ORDER BY ord, sort_key;
