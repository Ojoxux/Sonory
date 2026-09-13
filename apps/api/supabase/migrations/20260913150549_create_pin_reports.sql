-- 通報を記録するテーブルを追加する
--
-- これまで reportPin は sound_pins.status を 'reported' に更新していた。
-- SELECT ポリシーは status='active' のみ公開するため、
-- **通報1回でピンが即座に公開範囲から消える**状態だった。
-- 匿名アカウントは無制限に作れるので、誰でも任意のピンを取り下げられた。
--
-- 通報は記録に留め、非表示にするかは別途判断する。
-- あわせて reason の保存先ができる（従来はログにしか残らなかった）。

BEGIN;

CREATE TABLE IF NOT EXISTS public.pin_reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pin_id      UUID NOT NULL REFERENCES public.sound_pins(id) ON DELETE CASCADE,
  -- 通報者。退会しても通報記録は残す
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason      TEXT NOT NULL CHECK (char_length(reason) BETWEEN 10 AND 1000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 同一ユーザーによる同一ピンへの重複通報を防ぐ。
  -- 匿名アカウントを作り直せば回避できるが、素朴な連打は止まる
  CONSTRAINT pin_reports_unique_reporter UNIQUE (pin_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_pin_reports_pin_id
  ON public.pin_reports (pin_id);
CREATE INDEX IF NOT EXISTS idx_pin_reports_created_at
  ON public.pin_reports (created_at DESC);

-- 通報内容は運営のみが読む。ポリシーを作らないことで
-- anon / authenticated に対する既定拒否とし、service_role のみが読み書きする
ALTER TABLE public.pin_reports ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.pin_reports FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.pin_reports TO service_role;

-- 誤って 'reported' にされたピンを active へ戻す。
-- 旧実装では通報がそのまま非表示を意味していたため、
-- 運営判断を経ていない非表示が混ざっている
UPDATE public.sound_pins
SET status = 'active'
WHERE status = 'reported';

CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version    TEXT PRIMARY KEY,
  statements TEXT[],
  name       TEXT
);

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260913150549', 'create_pin_reports')
ON CONFLICT (version) DO NOTHING;

COMMIT;
