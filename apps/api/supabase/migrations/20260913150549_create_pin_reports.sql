-- 通報を記録するテーブルを追加する

BEGIN;

CREATE TABLE IF NOT EXISTS public.pin_reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pin_id      UUID NOT NULL REFERENCES public.sound_pins(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason      TEXT NOT NULL CHECK (char_length(reason) BETWEEN 10 AND 1000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pin_reports_unique_reporter UNIQUE (pin_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_pin_reports_pin_id
  ON public.pin_reports (pin_id);
CREATE INDEX IF NOT EXISTS idx_pin_reports_created_at
  ON public.pin_reports (created_at DESC);

ALTER TABLE public.pin_reports ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.pin_reports FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.pin_reports TO service_role;

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
