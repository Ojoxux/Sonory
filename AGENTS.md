# Sonory 開発ガイド

周囲の環境音を10秒録音し、AIが分類して地図上に記録するアプリ。
Turborepo モノレポ。Web は Next.js (OpenNext + Cloudflare Workers)、API は Hono (Workers)、
解析は Python (YAMNet)、DB は Supabase (PostgreSQL + PostGIS + pgmq)。

このファイルが実体。`CLAUDE.md` はここを参照するだけ。

---

# 第1部: 実装時ルール

**各項目には実際に起きた事故が紐づいている。** 守らないと同じ失敗を繰り返す。

## API ルートには認証とレート制限を必ず宣言する

`middleware` の省略は「未設定」であって「デフォルト」ではない。

```ts
const createPinRoute = createRoute({
   method: "post",
   middleware: [rateLimits.createPin, requireAuth],
   path: "/",
})
```

- 読み取り系は `optionalAuth`（未ログインでも地図を見られる必要がある）
- 書き込み系は `requireAuth`
- レート制限は認証より **前**。安いチェックを先に通し、認証処理自体も保護する
- 内部処理専用は `requireInternalDispatch`

> **事故:** `pins.ts` 10ルートと `audio.ts` 7ルートが認証もレート制限も未適用のまま5ヶ月放置。
> `DELETE /api/audio/{filePath}` は誰でも任意の音声ファイルを削除できた。
> 旧規約にはレート制限の表が書かれていたが、誰も実装しなかった。

## エラーハンドラは `app.onError` で登録する

```ts
app.onError(errorHandler) // ✅
app.use("*", errorHandler) // ❌ 例外が届かず平文の "Internal Server Error" になる
```

Hono の `compose` は例外をアプリの `onError` に回すため、外側ミドルウェアの `try/catch` には届かない。

> **事故:** 2026-05 から約4ヶ月、すべての `APIException` が 500 で返っていた。
> 401 も 400 も 500。`api-client` の 401 リトライも永久に発火しない状態だった。

## 検証は `task check` で4つすべて実行する

`task check` は type-check / lint / format / test をまとめて走らせる。個別に叩かないこと。

`oxlint` はフォーマットを見ない。`lint` が通っても `format` が落ちることがある。

> **事故:** Biome（lint + format 一体）から oxlint + oxfmt へ移行した際、CI が `lint` のままだった。
> 未整形のコードが CI を通過していた。現在は CI に `format` を追加済み。

## Tailwind のトークンは `globals.css` の `@theme` に書く

Tailwind v4 は `@config` の宣言が無い限り `tailwind.config.ts` を読まない。
設定ファイルを置いても無視される。

> **事故:** v3 から v4 へ移した際に `tailwind.config.ts` を残したまま `@config` を書かなかった。
> `animate-fade-in-down` / `animate-float` / `animate-wave-*` / `shadow-3xl` / `bg-primary-*` は
> どれも生成されておらず、`AppHeader` の入りのアニメーションは存在しないまま動いていた。
> 設定ファイルは `apps/web/` と `packages/config/` の2箇所にあり、どちらも死んでいた。

## DB アクセスは service_role とユーザークライアントを使い分ける

| 用途                   | クライアント               | 理由                                           |
| ---------------------- | -------------------------- | ---------------------------------------------- |
| 所有者に基づく書き込み | `getSupabaseUserClient(c)` | RLS の `auth.uid() = user_id` を効かせる       |
| 読み取り・内部処理     | `getSupabaseAdmin(env)`    | RLS をバイパス。既に条件で絞っている場合に使う |

**`sound_pins.user_id` は列レベルで `anon` / `authenticated` から SELECT 権限を剥奪している。**
ユーザークライアントでは `WHERE user_id = ...` を書くことすらできない。
所有者で絞る処理は `service_role` で行い、`userId` は検証済み JWT から導出する。

Workers 環境では **リクエストごとに JWT が異なる**。
ユーザークライアントをモジュールスコープでキャッシュしてはいけない。

> **事故:** `user_id` が公開読み取りで返っており、位置と時刻からピンを束ねて
> 個人の行動範囲を推測できる状態だった。

## スキーマの正は `apps/api/supabase/schema.sql`

- スキーマ変更は必ず `apps/api/supabase/migrations/` にファイルとして残す
- **SQL Editor で直接変更しない**
- **マージする前に適用する。** CI は `migrations/` が `schema.sql` の履歴に載っているかを見る
- 適用後は実DBをダンプし、`schema.sql` を突き合わせて更新する
- 変更前に `apps/api/supabase/tools/` の読み取り専用クエリで実DBの現状を確認する

破壊的変更（列の削除、リネーム、制約の追加、権限の剥奪）だけは順序が逆になる。
先に新旧両対応のコードをデプロイし、**別PRで**あとから適用する。
1本のPRに追加と破壊を混ぜない。

新しいファイルは `npx supabase migration new <name>` で作る（14桁のUTC）。
適用は Dashboard の SQL Editor に貼る。各ファイルは末尾で自身を
`supabase_migrations.schema_migrations` に登録する。

`schema.sql` の更新は実DBのダンプを正として該当箇所を書き換える。

`task db:dump` で `/tmp/sonory-schema-dump.sql` に出力される（`apps/api/.env.db` を読む）。

**ダンプをそのまま `schema.sql` にしない。** postgis が `public` にあるため
6000行超のうち約2700行が `st_*` への GRANT になり、アプリのスキーマが埋もれる。

> **事故:** 手動実行と SQL Editor 直叩きでファイルと実DBが乖離し、
> `anon` キーだけで到達できる書き込み経路が6つ開いていた。
>
> **事故:** 「適用したら `schema.sql` を再生成する」と README に書いてあったが
> 守られず、8本流した時点で乖離した。適用とマージが別々の出来事だったため。
> 現在は CI でマージの条件にしている。
>
> **事故:** `user_id` の列権限を剥奪したマイグレーションを適用した直後、
> まだ `.select("*")` を使っていた `DELETE` / `PUT` が「permission denied」で
> 落ちた。破壊的変更をコードより先に流したため。

## コメントは既存コードの密度に合わせる

既存コードのコメント率は **5〜25%**。

- TSDoc はエクスポートする関数・型にのみ。内部ヘルパーには不要
- **SQL ファイルは先頭に「何をするものか」を一文だけ**
- **同じ説明を複数ファイルに書かない**
- **README はルートの概要と起動手順だけ。** 開発上の知識はこのファイルに集約する
- そのファイルを読まないと分からないことだけ書く

> **事故:** 実質33行の SQL に62行のコメントを書き、同じ経緯を3箇所に重複させた。

## 環境変数の置き場所を間違えない

| ファイル              | 読むもの                        |
| --------------------- | ------------------------------- |
| `apps/web/.env.local` | Next.js（`NEXT_PUBLIC_*`）      |
| `apps/api/.dev.vars`  | wrangler（`SUPABASE_*` など）   |
| `apps/api/.env.db`    | `supabase db dump` の接続文字列 |
| ルート `.env`         | docker compose のみ             |

いずれも隣の `.example` をコピーして作る。`.env.db` は例が無いので
`SUPABASE_DB_URL=` の1行を書く（Session pooler、ポート 5432）。

`next dev` は `apps/web` を cwd に起動するため、**ルートの `.env` は Next.js に届かない。**

> **事故:** `NEXT_PUBLIC_SUPABASE_*` がどこにも定義されておらず、Realtime が一度も動いていなかった。

---

# 第2部: コーディング規約

## TypeScript

- `strict`, `noImplicitAny`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`,
  `noPropertyAccessFromIndexSignature` は常に有効
- **`any` 禁止**。不明な型は `unknown` → ナローイング
- すべての公開関数・メソッドは戻り型を宣言する
- 型アサーション（`as`）は最後の手段
- 既存型の拡張・宣言マージは `interface`、その他は `type`
- `const`, `readonly`, `as const` を優先し、副作用は専用モジュールに隔離
- 関数は単一責務に絞る

## ファイル構成

各コンポーネントは `PascalCase/` ディレクトリ。

- UI: `index.tsx` / 型: `types.ts` / ローカルフック: `hooks.ts`
- 純粋関数: `utils.ts` / 定数: `constants.ts`
- ルート階層のバレルファイルは作らない

**命名**: コンポーネント `PascalCase` / 関数・変数 `camelCase` / 定数 `UPPER_SNAKE_CASE`

## Atomic Design

`atoms → molecules → organisms → templates`。**下位レイヤは上位レイヤを参照しない。**

## Next.js (App Router)

**⚠️ Next.js 16 は破壊的変更が多い。** API・規約・ファイル構成が学習データと異なる。
**コードを書く前に `node_modules/next/dist/docs/` を読むこと。**
（モノレポではリポジトリルートから `next` パッケージが見えないことがあるため、
`apps/web/` を起点に解決する。deprecation notice に従うこと）

`next dev` による `AGENTS.md` / `CLAUDE.md` の自動生成は `agentRules: false` で無効化している
（未追跡ファイルが毎回生えるのを避けるため）。上記の警告はその代替。

- デフォルトは Server Components。インタラクション必須時のみ `"use client"`
- 各ページは `metadata` をエクスポート
- 画像は `next/image`
- リスト描画にはユニークで安定した `key`

## エラー処理と UX

- エラーバウンダリで重大な UI 崩壊を防ぐ
- ローディングは `Suspense` とスケルトン UI
- 非同期処理は必ず `try / catch`
- 成功・失敗はトーストやアラートで即時通知

## セキュリティ

- 機密情報は環境変数で管理し、クライアントに露出しない
- **`SUPABASE_SERVICE_KEY` は RLS をバイパスする。web 側に持ち込まない**
- ユーザー入力は `zod` でスキーマバリデーション
- `dangerouslySetInnerHTML` を避ける
- `.env.*` は Git 管理外。サンプルは `.env.example`

## アクセシビリティ

- セマンティック HTML を優先し、必要に応じて ARIA
- インタラクティブ要素はキーボード操作を保証
- WCAG 準拠のコントラスト比
- 画像には意味のある `alt`

## スタイリング

- Tailwind のユーティリティを使用。任意値（`[w-100px]` 等）は禁止
- トークンは `apps/web/src/app/globals.css` の `@theme` が単一の情報源
- 状態色は色相ではなく役割で書く（`accent` / `record` / `danger` / `analyze` / `done` / `warn`）。例: `bg-danger-500/10`
- 画面全体の重なりは `z-map` / `z-overlay` / `z-chrome` / `z-panel` / `z-prompt` を使い、数値を直書きしない
- `prefers-reduced-motion` を尊重
- モバイルファースト

---

# 第3部: ツールチェーン

**コマンドは Taskfile に集約している。** `task` で一覧が出る。
ルートの npm scripts は `prepare` と `postinstall` だけ。新しく足さないこと。

| 用途     | コマンド     | 実体                                                   |
| -------- | ------------ | ------------------------------------------------------ |
| 検証     | `task check` | `tsc --noEmit` / `oxlint` / `oxfmt --check` / `vitest` |
| 自動修正 | `task fix`   | `oxlint --fix` + `oxfmt`                               |

**Git フック（lefthook）**: pre-commit で変更パッケージのみ `oxlint --fix` / `oxfmt` / `tsc --noEmit`

**CI (`.github/workflows/lint.yml`)**: `npm ci` → oxlint → oxfmt → tsc → vitest →
Python 型生成の検証 → OpenAPI 生成型の整合性検証

## ローカル起動

```bash
task dev    # コンテナ + API :8787 + Web :3000
task down   # コンテナを停止（API と Web は Ctrl+C で止まる）
```

解析キューは Cron Trigger で消費されるが、`wrangler dev` は Cron を自動実行しない。
さらに `scheduled` ハンドラは `ENVIRONMENT=development` で早期 return する。
手で叩く場合:

```bash
curl -X POST http://localhost:8787/api/audio/internal/process-queue \
  -H 'Host: scheduled.sonory.internal' -H 'x-sonory-scheduled: true'
```

`wrangler dev` で HTTPS の fetch だけが `internal error; reference = ...` で失敗する場合、
workerd が CA 証明書を見つけられていない（NixOS 等）。`SSL_CERT_FILE` を設定する。
