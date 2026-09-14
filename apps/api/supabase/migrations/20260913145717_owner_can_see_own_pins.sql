-- 所有者は自分のピンを status に関わらず閲覧できるようにする
--
-- 20260912071028 の SELECT ポリシーは status = 'active' のみを許可していた。
-- API の削除は status='deleted' への UPDATE（論理削除）なので、更新後の行が
-- 自分自身から見えなくなり、PostgREST の RETURNING が
-- "new row violates row-level security policy" で失敗していた。
--
-- 結果として DELETE /api/pins/{id} が 500 になっていた。
-- 公開範囲は変わらない。auth.uid() = user_id は所有者本人にしか一致しない。

BEGIN;

DROP POLICY IF EXISTS "Public pins are viewable by everyone" ON public.sound_pins;
CREATE POLICY "Public pins are viewable by everyone"
  ON public.sound_pins FOR SELECT
  USING (status = 'active' OR auth.uid() = user_id);

CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version    TEXT PRIMARY KEY,
  statements TEXT[],
  name       TEXT
);

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260913145717', 'owner_can_see_own_pins')
ON CONFLICT (version) DO NOTHING;

COMMIT;
