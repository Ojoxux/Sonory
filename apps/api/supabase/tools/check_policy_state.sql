-- sound_pins の RLS ポリシーの現状確認（読み取り専用）
--
-- 20260912071028 の適用が途中で失敗した場合、DROP POLICY だけが通って
-- CREATE POLICY が実行されていない可能性がある。その状態だと
-- service_role の書き込みポリシーが消えたまま新ポリシーも無く、
-- API からの書き込みがすべて拒否される。
--
-- 期待されるどちらかの状態:
--   (A) 未適用（ロールバック済み）… 4件
--       Public pins are viewable by everyone / Service role can insert|update|delete pins
--   (B) 適用完了 … 4件
--       Public pins are viewable by everyone / Users can insert|update|delete their own pins
--
-- それ以外（特に1件だけ、や0件）は中途半端な状態なので要修復。

SELECT
  policyname,
  cmd,
  array_to_string(roles, '+') AS roles,
  coalesce(qual, '-')       AS using_expr,
  coalesce(with_check, '-') AS with_check_expr
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'sound_pins'
ORDER BY cmd, policyname;
