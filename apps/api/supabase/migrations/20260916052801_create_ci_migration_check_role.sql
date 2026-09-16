-- CI の適用状況チェック専用ロールを作る
--
-- tools/check_migrations_applied.sh が実DBの履歴テーブルを読むために使う。
-- postgres ロールの接続情報を GitHub Secrets に置くと、漏れたときに
-- auth.users を含む全テーブルの読み書きと RLS のバイパスまで渡ることになる。
-- 読みたいのは version 列だけなので、それだけができるロールを分ける。
--
-- 【パスワードはこのファイルで設定しない。】
-- リポジトリに入ってしまうため、適用後に SQL Editor で別途設定する（末尾を参照）。

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ci_migration_check') THEN
    -- NOINHERIT: 将来このロールが他のロールに所属しても権限を自動で引き継がない
    CREATE ROLE ci_migration_check LOGIN NOINHERIT;
  END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version    TEXT PRIMARY KEY,
  statements TEXT[],
  name       TEXT
);

-- GRANT は対象が存在してからでないと失敗するため、上の CREATE より後に置く
GRANT USAGE ON SCHEMA supabase_migrations TO ci_migration_check;
GRANT SELECT ON supabase_migrations.schema_migrations TO ci_migration_check;

-- public スキーマのテーブルには一切 GRANT しない。
-- PostgreSQL 15 以降は public への CREATE が PUBLIC から剥奪済みなので、
-- USAGE だけが残る。テーブル権限が無いため何も読めない。
REVOKE ALL ON SCHEMA public FROM ci_migration_check;

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260916052801', 'create_ci_migration_check_role')
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- 適用後にやること（SQL Editor で実行。パスワードは会話やリポジトリに残さない）:
--
--   ALTER ROLE ci_migration_check PASSWORD '<生成したパスワード>';
--
-- そのうえで GitHub の Secrets に SUPABASE_DB_URL を登録する。
-- Supavisor 経由のユーザ名は <ロール名>.<project-ref> の形式:
--
--   postgresql://ci_migration_check.<project-ref>:<password>@<pooler-host>:5432/postgres
--
-- 権限の確認:
--
--   SELECT has_table_privilege('ci_migration_check',
--            'supabase_migrations.schema_migrations', 'SELECT') AS can_read_versions,
--          has_table_privilege('ci_migration_check', 'public.sound_pins', 'SELECT') AS can_read_pins,
--          has_schema_privilege('ci_migration_check', 'auth', 'USAGE') AS can_touch_auth;
--
-- can_read_versions だけが true になること。
