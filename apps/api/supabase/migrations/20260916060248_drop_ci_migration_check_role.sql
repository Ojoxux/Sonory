-- CI の適用状況チェック専用ロールを削除する

BEGIN;

REVOKE ALL ON supabase_migrations.schema_migrations FROM ci_migration_check;
REVOKE ALL ON SCHEMA supabase_migrations FROM ci_migration_check;

DROP ROLE IF EXISTS ci_migration_check;

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260916060248', 'drop_ci_migration_check_role')
ON CONFLICT (version) DO NOTHING;

COMMIT;
