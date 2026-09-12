-- RLS を auth.uid() ベースの所有権モデルへ移行する (Issue #117)
--
-- 孤児ピン（認証実装前に作成された user_id IS NULL）はどの条件にも合致せず、
-- 閲覧のみ可・編集/削除不可になる。意図した挙動で特別な分岐は不要。
--
-- ⚠️ 20260912071029_auth_schema.sql より先に適用すること。
-- 逆順だと INSERT ポリシーが無い状態で create_sound_pin に RLS が効き、
-- ピン作成がすべて拒否される。

BEGIN;

GRANT SELECT ON public.sound_pins TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.sound_pins TO authenticated;

DROP POLICY IF EXISTS "Service role can insert pins" ON public.sound_pins;
DROP POLICY IF EXISTS "Service role can update pins" ON public.sound_pins;
DROP POLICY IF EXISTS "Service role can delete pins" ON public.sound_pins;

DROP POLICY IF EXISTS "Public pins are viewable by everyone" ON public.sound_pins;
CREATE POLICY "Public pins are viewable by everyone"
  ON public.sound_pins FOR SELECT
  USING (status = 'active');

-- create_sound_pin 経由の INSERT に効くのは、20260912071029 で同関数を
-- SECURITY INVOKER 化した後。それまでは DEFINER のため RLS を迂回する。
CREATE POLICY "Users can insert their own pins"
  ON public.sound_pins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pins"
  ON public.sound_pins FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- API の削除は status='deleted' への UPDATE（論理削除）なので、実運用で効くのは
-- 上の UPDATE ポリシー。これは将来の物理削除に備えた多層防御。
CREATE POLICY "Users can delete their own pins"
  ON public.sound_pins FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 履歴テーブルは CLI の db push が自動作成するが、SQL Editor 運用では存在しない
CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version    TEXT PRIMARY KEY,
  statements TEXT[],
  name       TEXT
);

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260912071028', 'auth_rls_policies')
ON CONFLICT (version) DO NOTHING;

COMMIT;
