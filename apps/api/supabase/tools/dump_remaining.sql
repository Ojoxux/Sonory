-- リベースラインに必要な残りの情報（読み取り専用）
-- _dump_schema.sql / _dump_functions.sql で取れなかった項目を補完する。

WITH
-- 全関数の EXECUTE 権限。特に queue_send が anon から呼べると
-- 解析キューに任意のジョブを詰められるため要確認。
fn_grants AS (
  SELECT
    '1. 関数のEXECUTE権限' AS section,
    p.proname AS sort_key,
    p.proname AS item,
    string_agg(
      r.rolname || '=' || has_function_privilege(r.rolname, p.oid, 'EXECUTE')::text,
      ' ' ORDER BY r.rolname
    ) AS detail
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  CROSS JOIN (
    SELECT rolname FROM pg_roles
    WHERE rolname IN ('anon', 'authenticated', 'service_role')
  ) r
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'create_sound_pin', 'find_nearby_pins', 'find_pins_within_bounds',
      'find_nearby_pins_by_ids', 'queue_send', 'queue_read', 'queue_delete'
    )
  GROUP BY p.proname
),

-- トリガー（002 の update_updated_at トリガーが実在するか）
triggers AS (
  SELECT
    '2. トリガー' AS section,
    t.tgname AS sort_key,
    format('%s.%s', c.relname, t.tgname) AS item,
    pg_get_triggerdef(t.oid) AS detail
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND NOT t.tgisinternal
),

-- Storage バケット（音声ファイルの置き場。リベースラインの対象外だが構成は記録しておく）
buckets AS (
  SELECT
    '3. Storageバケット' AS section,
    id AS sort_key,
    id AS item,
    format('public=%s file_size_limit=%s allowed_mime=%s',
      public,
      coalesce(file_size_limit::text, '-'),
      coalesce(array_to_string(allowed_mime_types, ','), '-')) AS detail
  FROM storage.buckets
),

-- pgmq のキュー一覧
queues AS (
  SELECT
    '4. pgmqキュー' AS section,
    queue_name AS sort_key,
    queue_name AS item,
    format('unlogged=%s created_at=%s', is_unlogged, created_at) AS detail
  FROM pgmq.meta
)

SELECT section, item, detail FROM (
  SELECT 1 AS ord, section, sort_key, item, detail FROM fn_grants
  UNION ALL SELECT 2, section, sort_key, item, detail FROM triggers
  UNION ALL SELECT 3, section, sort_key, item, detail FROM buckets
  UNION ALL SELECT 4, section, sort_key, item, detail FROM queues
) t
ORDER BY ord, sort_key;
