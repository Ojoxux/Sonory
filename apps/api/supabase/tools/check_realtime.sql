-- Realtime (postgres_changes) の購読対象になっているかを確認する（読み取り専用）
--
-- Supabase の Realtime は supabase_realtime という publication に
-- 含まれるテーブルの変更のみを配信する。
-- ダッシュボードの Database > Replication で有効化していないと何も届かない。

SELECT
   'publication に含まれるテーブル' AS section,
   schemaname || '.' || tablename AS item,
   '' AS detail
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'

UNION ALL

SELECT
   'publication 自体の有無' AS section,
   pubname AS item,
   format('insert=%s update=%s delete=%s', pubinsert, pubupdate, pubdelete) AS detail
FROM pg_publication
WHERE pubname = 'supabase_realtime'

ORDER BY section, item;
