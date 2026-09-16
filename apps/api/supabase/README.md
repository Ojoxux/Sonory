# Sonory データベース

Supabase (PostgreSQL + PostGIS + pgmq) のスキーマ管理。

## 構成

```
supabase/
  schema.sql      実DBのスナップショット（ダンプと突き合わせて更新する）
  migrations/     スキーマ変更の記録（適用される実体）
  tools/          実DBを調査する読み取り専用クエリ
```

### 2つのファイルの役割

|               | 役割                                               | 編集             |
| ------------- | -------------------------------------------------- | ---------------- |
| `migrations/` | **何をどう変えるか**。実際に適用されるもの         | 手で書く         |
| `schema.sql`  | **今どうなっているか**。適用結果のスナップショット | ダンプに合わせる |

食い違いが出たら、**正しいのは実DB**であり `schema.sql` の更新が必要という合図。
実DBのダンプと突き合わせると、SQL Editor での直接変更などによる乖離が
そのまま差分に現れる。これが乖離検知の仕組みになる。

## マイグレーション

| ファイル                                               | 内容                                                                              | 状態                  |
| ------------------------------------------------------ | --------------------------------------------------------------------------------- | --------------------- |
| `20260912071028_auth_rls_policies.sql`                 | RLS を `auth.uid()` ベースの所有権モデルへ                                        | 適用済み (2026-09-12) |
| `20260912071029_auth_schema.sql`                       | `create_sound_pin` の INVOKER 化、`user_id` の外部キー                            | 適用済み (2026-09-12) |
| `20260912113306_hide_user_id_from_clients.sql`         | RPC の戻り値から `user_id` を除去、未使用関数 `find_nearby_pins_by_ids` を削除    | 適用済み (2026-09-12) |
| `20260912113856_restrict_user_id_column.sql`           | `user_id` を列指定 GRANT で anon / authenticated から隠す                         | 適用済み (2026-09-12) |
| `20260913145717_owner_can_see_own_pins.sql`            | SELECT ポリシーに `auth.uid() = user_id` を追加し所有者は非公開状態でも閲覧可能に | 適用済み (2026-09-13) |
| `20260913150549_create_pin_reports.sql`                | 通報を記録する `pin_reports` テーブルを追加                                       | 適用済み (2026-09-13) |
| `20260914094720_enable_realtime_for_sound_pins.sql`    | `sound_pins` を `supabase_realtime` publication に追加                            | 適用済み (2026-09-14) |
| `20260914115424_create_sound_pin_accepts_analysis.sql` | `create_sound_pin` に `p_ai_analysis_result` 引数を追加                           | 適用済み (2026-09-14) |

`20260912071028` → `20260912071029` には適用順序の依存があった。
逆順だと、INSERT ポリシーが存在しない状態で `create_sound_pin` に RLS が
効くようになり、ピン作成がすべて拒否される。
今後も依存がある場合は各ファイルの冒頭に明記すること。

### ファイル名

Supabase CLI の形式に従う: `<YYYYMMDDHHMMSS>_<name>.sql`（UTC、14桁）。
`npx supabase migration new <name>` が正しい名前で空ファイルを作ってくれるので、
手で名前を決めずにこれを使う。

数値部分は連番ではなく**実際の作成時刻**。秒まで持つのは冗長に見えるが、
短くすると次の2つの問題が出るため14桁を維持している。

1. **8桁（日付のみ）は CLI を壊す。**
   8桁と14桁が同じ数値プレフィックスを共有すると順序判定が反転し、
   `db push` が「ローカルにマイグレーションが無い」と誤判定して
   二度と通らなくなる（supabase/cli#6036）。
   このリポジトリは既に `20260912` で始まる14桁を持っているため、
   8桁を足すとまさにその条件を作ることになる。

2. **日付だけでは衝突する。**
   `schema_migrations.version` は主キーなので、同じ日に2本作ると入らない。
   区別するには時刻か連番が必要になり、短くした意味が無くなる。

読むときは時刻部分を無視して、ファイル名の後半（`_auth_rls_policies` など）で
識別すればよい。

### 適用方法

Supabase Dashboard の SQL Editor にファイルの内容を貼り付けて実行する。

各マイグレーションは末尾で `supabase_migrations.schema_migrations` に自身を
登録する。これは Supabase CLI が参照する履歴テーブルなので、後から CLI 運用へ
切り替えても適用済みのものが再実行されることはない。

CLI を使う場合（Docker が必要）:

```bash
npx supabase db push --db-url "\$SUPABASE_DB_URL"
```

接続文字列は Dashboard > Project Settings > Database の **Session pooler**
（ポート 5432）。`supabase link` は `cli_login_postgres` ロールの権限エラーで
失敗することがあるため、`--db-url` で直接指定する方が確実。

### `schema.sql` の更新方法

適用後は実DBをダンプし、それを正として `schema.sql` を更新する（Docker が必要）。
接続文字列は上記「適用方法」と同じ。コマンド履歴に平文で残らないよう、
`SUPABASE_DB_URL=...` の1行を書いた Git 管理外のファイルを `source` してから叩く。

```bash
set -a; . ./.env.db; set +a   # apps/api/.env.db
npx supabase db dump --db-url "$SUPABASE_DB_URL" -f /tmp/schema_dump.sql
```

**ダンプをそのまま `schema.sql` にしないこと。** PostGIS が `extensions` ではなく
`public` に入っているため、ダンプは6000行超のうち約2700行が `st_*` 関数への
GRANT の羅列になる。アプリのスキーマが埋もれて差分が読めなくなる。

ダンプは**照合の正**として使い、`schema.sql` 側は節構成と経緯コメントを保ったまま
該当箇所を書き換える。ダンプに無いものを書かないこと。差分が出た箇所が、
マイグレーション以外の経路で実DBが変わった証拠になる。

## 新規プロジェクトを立ち上げる場合

1. Dashboard > Database > Extensions から `postgis` と `pgmq` を有効化する
   （素の `CREATE EXTENSION` は `public` に作ってしまい、`pgmq_public.*` の
   参照が壊れるため）

   本番DBの実際の配置は `postgis` が `public`、`uuid-ossp` と `pgcrypto` が
   `extensions`。`postgis` が `public` にあること自体は問題ない（関数は
   `SET search_path = public` で動くため、むしろ解決しやすい）が、
   `schema.sql` の更新時にダンプが GRANT の羅列で膨らむ原因になっている。

2. `schema.sql` を適用する
3. `migrations/` の未適用分を順に適用する

## 調査ツール（`tools/`）

すべて読み取り専用。SQL Editor は複数ステートメントを実行しても最後の結果しか
返さないため、各ファイルは1つの結果セットを返すよう1クエリに畳んである。

| ファイル                       | 用途                                                                   |
| ------------------------------ | ---------------------------------------------------------------------- |
| `introspect_current_state.sql` | RLS ポリシー、関数の SECURITY 属性と `search_path`、列定義、データ件数 |
| `dump_schema.sql`              | 列・制約・インデックス・テーブル権限・拡張の一覧                       |
| `dump_functions.sql`           | `pg_get_functiondef()` による関数定義の全文                            |
| `dump_remaining.sql`           | 関数の EXECUTE 権限、トリガー、Storage バケット、pgmq キュー           |
| `verify_hardening.sql`         | `anon` 経路が塞がれていることの検証                                    |

## 経緯: なぜこの構成になったか

以前は `apps/api/sql/001〜013` を手動で SQL Editor に貼る運用で、適用状態を
追跡する仕組みが無かった。その結果、リポジトリのファイルと実DBが乖離していた。
2026-09-12 時点で確認された乖離:

- `analysis_results` テーブルと `sound_pins.ai_analysis_result` 列は実DBに
  存在するが、リポジトリに作成 DDL が無かった
- `sound_pins` の `ai_transcription` 等 6 列はリポジトリでは定義されていたが、
  実DBでは既に削除されていた
- 関数6本（検索系3本・キュー操作3本）の `anon` への GRANT が記録されていなかった
- Storage バケットの `file_size_limit` と `allowed_mime_types` が失われていた
- インデックス3本がリポジトリに存在しなかった

この乖離は実害を生んでいた。古いファイルを読んだ判断が誤っていた例があり
（`004` の GRANT 記述を根拠に「anon には未付与」と結論したが、実DBでは
付与されていた）、`anon` キーだけで到達できる書き込み経路が4つ開いていた
（キュー操作、ピン作成、解析結果の改ざん、Storage への任意アップロードと削除）。

## 運用ルール

1. **スキーマ変更は必ず `migrations/` にファイルとして残す。**
   SQL Editor で直接変更しない。これが過去の乖離の原因だった。
2. 適用したら実DBをダンプし、`schema.sql` を突き合わせて更新しコミットする。
3. 変更を適用する前に `tools/` で実DBの現状を確認する。
   特に `DROP POLICY IF EXISTS` はポリシー名が一致しないと黙って no-op になり、
   緩いポリシーが残ったまま新ポリシーが追加される（RLS は複数ポリシーを OR で
   評価するため、意図した制限が効かない）。
