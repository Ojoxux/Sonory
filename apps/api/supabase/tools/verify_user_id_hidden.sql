-- user_id 隠蔽マイグレーションの検証
--
-- ⚠️ このファイルは2部構成。SQL Editor は最後の結果しか返さないため、
--    【A】と【B】を別々に実行すること。
--
-- =============================================================================
-- 【A】静的な確認（読み取り専用）
-- =============================================================================
-- 期待値:
--   1. 関数の戻り値    user_id を含まないこと。find_nearby_pins_by_ids は存在しないこと
--   2. 列レベル権限    anon / authenticated の user_id への SELECT が無いこと
--                      （他の列は SELECT できること）
--   3. service_role    user_id を含む全列を読めること

WITH
fn_returns AS (
  SELECT
    '1. 関数の戻り値' AS section,
    p.proname AS sort_key,
    p.proname AS item,
    CASE
      WHEN pg_get_function_result(p.oid) LIKE '%user_id%'
        THEN '❌ user_id を含む'
      ELSE '✅ user_id を含まない'
    END AS detail
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'create_sound_pin', 'find_nearby_pins',
      'find_pins_within_bounds', 'find_nearby_pins_by_ids'
    )
),
dropped AS (
  SELECT
    '1. 関数の戻り値' AS section,
    'zz_by_ids' AS sort_key,
    'find_nearby_pins_by_ids' AS item,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'find_nearby_pins_by_ids'
      ) THEN '❌ まだ存在する'
      ELSE '✅ 削除済み'
    END AS detail
),
col_privs AS (
  SELECT
    '2. 列レベル権限' AS section,
    format('%s.%s', r.rolname, c.column_name) AS sort_key,
    format('%-14s %s', r.rolname, c.column_name) AS item,
    format('SELECT=%s',
      has_column_privilege(r.rolname, 'public.sound_pins', c.column_name, 'SELECT')
    ) AS detail
  FROM information_schema.columns c
  CROSS JOIN (
    SELECT rolname FROM pg_roles
    WHERE rolname IN ('anon', 'authenticated', 'service_role')
  ) r
  WHERE c.table_schema = 'public' AND c.table_name = 'sound_pins'
    -- user_id と、比較用に必ず読めるはずの id を見る
    AND c.column_name IN ('user_id', 'id')
)

SELECT section, item, detail FROM (
  SELECT 1 AS ord, * FROM fn_returns
  UNION ALL SELECT 1, * FROM dropped
  UNION ALL SELECT 2, * FROM col_privs
) t
ORDER BY ord, sort_key;


-- =============================================================================
-- 【B】RLS の所有者判定が壊れていないかの実地テスト
-- =============================================================================
-- 上の【A】とは別に、以下をまとめて選択して実行すること。
--
-- 目的:
--   UPDATE / DELETE のポリシーは auth.uid() = user_id を参照している。
--   user_id の SELECT 権限を剥奪したことで、ポリシー評価まで巻き添えで
--   壊れていないかを確認する。
--
-- 判定:
--   «UPDATE 0» が返れば成功。ポリシーは正常に評価され、
--   該当行が無かっただけ（既存ピンは user_id IS NULL の孤児ピンのため）。
--
--   «permission denied for column user_id» が返れば失敗。
--   その場合は次の1行で列剥奪だけ巻き戻すこと:
--     GRANT SELECT (user_id) ON public.sound_pins TO anon, authenticated;
--
-- ROLLBACK で終わるため、データは一切変更されない。

-- BEGIN;
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}';
-- UPDATE public.sound_pins SET title = title WHERE status = 'active';
-- ROLLBACK;
