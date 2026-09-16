#!/usr/bin/env bash
#
# migrations/ の各ファイルが実DBの履歴テーブルに登録されているかを検証する。
#
# 「適用した」と「マージした」が別々の出来事だったため、schema.sql が実DBから
# 3日ぶん遅れた。これをマージの条件にすることで、適用忘れを覚えておく必要をなくす。
#
# ローカル:
#   set -a; . apps/api/.env.db; set +a
#   apps/api/supabase/tools/check_migrations_applied.sh
#
set -euo pipefail

migrations_dir="$(cd "$(dirname "$0")/../migrations" && pwd)"

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
   echo "SUPABASE_DB_URL が設定されていません" >&2
   exit 1
fi

applied="$(psql "$SUPABASE_DB_URL" -Atc \
   "SELECT version FROM supabase_migrations.schema_migrations")"

missing=()
for file in "$migrations_dir"/*.sql; do
   name="$(basename "$file")"
   if ! grep -qxF "${name%%_*}" <<<"$applied"; then
      missing+=("$name")
   fi
done

# 実DBにあってファイルが無いもの。SQL Editor で直接流した痕跡の可能性がある
unknown=()
while IFS= read -r version; do
   [[ -z "$version" ]] && continue
   if ! compgen -G "$migrations_dir/${version}_*.sql" >/dev/null; then
      unknown+=("$version")
   fi
done <<<"$applied"

if ((${#unknown[@]} > 0)); then
   echo "警告: 実DBに登録されているがファイルが無いバージョンがあります:" >&2
   printf '  %s\n' "${unknown[@]}" >&2
fi

if ((${#missing[@]} > 0)); then
   echo "実DBに未適用のマイグレーションがあります:" >&2
   printf '  %s\n' "${missing[@]}" >&2
   echo >&2
   echo "マージ前に適用してください。手順は apps/api/supabase/README.md。" >&2
   exit 1
fi

echo "migrations/ の $(ls -1 "$migrations_dir"/*.sql | wc -l) 本すべてが適用済みです"
