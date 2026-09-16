#!/usr/bin/env bash
#
# migrations/ のファイルが schema.sql のマイグレーション履歴に載っているかを検証する。
#
# 適用したのに schema.sql を更新し忘れる、というのが実際に起きた乖離。
# ファイルを読むだけで実DBには接続しない。
#
#   apps/api/supabase/tools/check_schema_sync.sh
#
set -euo pipefail

supabase_dir="$(cd "$(dirname "$0")/.." && pwd)"

recorded="$(grep -oE "^ *\('[0-9]{14}'" "$supabase_dir/schema.sql" | grep -oE '[0-9]{14}')"

missing=()
for file in "$supabase_dir"/migrations/*.sql; do
   name="$(basename "$file")"
   if ! grep -qxF "${name%%_*}" <<<"$recorded"; then
      missing+=("$name")
   fi
done

# schema.sql にあってファイルが無いもの。リベースライン以前の分は正常
extra=()
while IFS= read -r version; do
   [[ -z "$version" ]] && continue
   if ! compgen -G "$supabase_dir/migrations/${version}_*.sql" >/dev/null; then
      extra+=("$version")
   fi
done <<<"$recorded"

if ((${#extra[@]} > 0)); then
   echo "参考: schema.sql にあって migrations/ に無いバージョン: ${extra[*]}"
fi

if ((${#missing[@]} > 0)); then
   echo "schema.sql の履歴に無いマイグレーションがあります:" >&2
   printf '  %s\n' "${missing[@]}" >&2
   echo >&2
   echo "実DBをダンプして schema.sql を更新してください。手順は AGENTS.md。" >&2
   exit 1
fi

echo "migrations/ の $(ls -1 "$supabase_dir"/migrations/*.sql | wc -l) 本すべてが schema.sql に記録されています"
