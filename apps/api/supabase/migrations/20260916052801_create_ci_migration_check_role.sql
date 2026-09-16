-- CI の適用状況チェック専用ロールを作る

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ci_migration_check') THEN
    CREATE ROLE ci_migration_check LOGIN NOINHERIT;
  END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version    TEXT PRIMARY KEY,
  statements TEXT[],
  name       TEXT
);

GRANT USAGE ON SCHEMA supabase_migrations TO ci_migration_check;
GRANT SELECT ON supabase_migrations.schema_migrations TO ci_migration_check;
REVOKE ALL ON SCHEMA public FROM ci_migration_check;

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260916052801', 'create_ci_migration_check_role')
ON CONFLICT (version) DO NOTHING;

COMMIT;
