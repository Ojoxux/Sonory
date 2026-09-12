-- 実DBの関数定義をソースごと吸い出す（読み取り専用）
--
-- 用途: リベースライン用。pg_get_functiondef() は実DBに格納されている
--       関数の完全な定義（引数・戻り値・SECURITY 属性・SET 句・本体）を返すため、
--       リポジトリの SQL ファイルと実DBのどちらが正かを推測せずに確定できる。
--
-- 出力が長いので、SQL Editor の結果をそのまま読むより
-- 右上の «Download CSV» で落として渡す方が確実。

SELECT
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  -- pgmq のラッパーや PostGIS 本体の関数まで含めると膨大になるため、
  -- アプリが実際に呼ぶものと、それに関連するトリガ関数だけに絞る。
  AND p.proname IN (
    'create_sound_pin',
    'find_nearby_pins',
    'find_pins_within_bounds',
    'find_nearby_pins_by_ids',
    'queue_send',
    'queue_read',
    'queue_delete',
    'update_updated_at_column'
  )
ORDER BY p.proname;
