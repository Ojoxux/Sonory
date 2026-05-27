# OpenAPI Schema 型自動生成 — 実装計画

## 背景・目的

フェーズ1で `packages/shared-types` に手書き Zod スキーマを Single Source of Truth として整備した。
しかし現状は **API 定義（Hono routes）と shared-types の Zod スキーマが二重管理** になっており、API 仕様変更時に乖離するリスクがある。

本提案では **OpenAPI 仕様書（openapi.json）を唯一の型の源泉** として、TypeScript / Python の型をすべて自動生成する構成に移行する。

---

## 現状の課題

### 1. Zod スキーマの二重定義

| 定義場所 | 例 |
|---|---|
| `packages/shared-types/src/api.ts` | `SoundPinCreateRequestSchema`, `NearbyPinsQuerySchema` |
| `apps/api/src/routes/pins.ts` | `createPinSchema`, `nearbyPinsSchema`, `searchPinsSchema` |

→ **同じデータ構造が2箇所に存在**。routes 側のスキーマはバリデーション用、shared-types 側はフロント共有用。片方を変更してもう片方が追従しないと型の不整合が発生する。

### 2. フロントエンドの手動型定義

`apps/web/src/services/pin-api.ts` に `PinApiResponse`, `DbPin`, `PinCreateParams` 等のインターフェースが手書きされており、バックエンド API の返却値と乖離する可能性がある。

### 3. Python ↔ TypeScript 間の型共有が手動

`apps/python-audio-analyzer` の Pydantic モデル（`ClassificationResult`, `AnalysisResult`, `EnvironmentAnalysis`）と `packages/shared-types/src/audio.ts` の `PythonAnalysisResultSchema` は手動で同期しており、変更漏れのリスクがある。

---

## 提案アーキテクチャ

```
┌──────────────────────────────────────────────────────────────────┐
│  apps/api (Hono + @hono/zod-openapi)                            │
│  ──────────────────────────────────────                          │
│  Zod スキーマで route を定義                                      │
│  → GET /api/openapi.json を自動生成                               │
└────────────────────┬─────────────────────────────────────────────┘
                     │ openapi.json
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  packages/shared-types                                           │
│  ──────────────────────                                          │
│  npm run generate:types                                          │
│  → openapi-typescript で .d.ts 生成                               │
│  → （オプション）Zod スキーマも openapi-zod-client で生成           │
└────────────────────┬─────────────────────────────────────────────┘
                     │ import
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  apps/web                                                        │
│  ──────────                                                      │
│  @sonory/shared-types から生成済み型を import                      │
│  手書きの PinApiResponse, DbPin 等を廃止                          │
└──────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────┐
│  apps/python-audio-analyzer (FastAPI)                            │
│  ──────────────────────────────────                              │
│  FastAPI が自動的に /docs, /openapi.json を提供済み                │
│  → Pydantic モデルが SSoT                                        │
└────────────────────┬─────────────────────────────────────────────┘
                     │ openapi.json
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  packages/python-types                                           │
│  ──────────────────────                                          │
│  openapi-typescript で Python API の型を生成                      │
│  → PythonAnalysisResult 等の手書き Zod を廃止                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 技術選定

### Hono 側: `@hono/zod-openapi`

**理由:**
- Hono 公式のファーストパーティパッケージ
- 既存の Zod スキーマ（`@hono/zod-validator` で使用中）をそのまま OpenAPI に変換可能
- routes のバリデーションと OpenAPI Spec 生成を1箇所で定義できる

**変更の性質:**
- `Hono` → `OpenAPIHono` に置き換え
- 各 route を `createRoute()` + `app.openapi()` の形式に書き換え
- 既存の `zValidator` 呼び出しは `createRoute` 内のスキーマ定義に統合される

### TypeScript 型生成: `openapi-typescript`

**理由:**
- OpenAPI 3.x → TypeScript の定番ツール（npm weekly 500K+）
- ランタイム依存なし（`.d.ts` のみ生成）
- パスパラメータ、クエリ、リクエストボディ、レスポンスすべてを型化

**使い方:**
```bash
# ローカルファイルから生成
npx openapi-typescript ./openapi.json -o ./src/generated/api.d.ts

# またはサーバーから直接
npx openapi-typescript http://localhost:8787/api/openapi.json -o ./src/generated/api.d.ts
```

### （オプション）型安全 API クライアント: `openapi-fetch`

**理由:**
- `openapi-typescript` と同じ作者の fetch ラッパー
- パスパラメータ、クエリパラメータ、ボディの型が自動で効く
- 既存の `ApiClient` インターフェース（Phase 6 で導入済み）を置き換え可能

```typescript
import createClient from "openapi-fetch"
import type { paths } from "@sonory/shared-types/generated/api"

const client = createClient<paths>({ baseUrl: "/api" })

// パス、クエリ、レスポンスすべてが型安全
const { data } = await client.GET("/pins/nearby", {
  params: { query: { north: 35.7, south: 35.6, east: 139.8, west: 139.7 } }
})
```

---

## 実装ステップ

### Step 1: Hono routes を `@hono/zod-openapi` に移行

**対象ファイル:**
- `apps/api/src/routes/pins.ts` (478行)
- `apps/api/src/routes/audio.ts` (383行)
- `apps/api/src/routes/health.ts` (149行)
- `apps/api/src/index.ts` (195行)

**作業内容:**
1. `@hono/zod-openapi` をインストール
2. `Hono` → `OpenAPIHono` に置き換え
3. 各エンドポイントを `createRoute()` で定義
4. レスポンスの Zod スキーマも定義（現状は手書き `c.json(...)` のみ）
5. `/api/openapi.json` エンドポイントを追加

**例（pins nearby の場合）:**
```typescript
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"

const nearbyRoute = createRoute({
  method: "get",
  path: "/nearby",
  request: {
    query: nearbyPinsSchema, // 既存 Zod スキーマを再利用
  },
  responses: {
    200: {
      content: { "application/json": { schema: nearbyPinsResponseSchema } },
      description: "周辺ピン一覧",
    },
  },
})

app.openapi(nearbyRoute, async (c) => {
  // ハンドラー実装（既存ロジックをそのまま使用）
})
```

**工数見込み:** 1-2日

### Step 2: OpenAPI Spec から TypeScript 型を生成するパイプラインを構築

**作業内容:**
1. `packages/shared-types` に `openapi-typescript` をインストール
2. API サーバーから `openapi.json` をフェッチするスクリプトを追加
3. 生成された `.d.ts` を `src/generated/` に出力
4. `package.json` に `generate:types` スクリプトを追加
5. CI で openapi.json と生成型の不整合を検知するチェックを追加

**ディレクトリ構成:**
```
packages/shared-types/
├── src/
│   ├── generated/
│   │   ├── hono-api.d.ts    ← Hono API から生成
│   │   └── python-api.d.ts  ← Python API から生成
│   ├── location.ts          ← 引き続きドメイン型として残す
│   ├── weather.ts           ← 同上
│   ├── audio.ts             ← Python API 生成型で置き換え検討
│   ├── api.ts               ← Hono API 生成型で置き換え
│   └── index.ts
├── openapi/
│   ├── hono-api.json        ← `npm run fetch:openapi` で取得
│   └── python-api.json      ← 同上
├── scripts/
│   └── generate-types.ts    ← 型生成スクリプト
└── package.json
```

**工数見込み:** 0.5-1日

### Step 3: フロントエンドの手書き型を生成型に置き換え

**対象:**
- `apps/web/src/services/pin-api.ts` の `PinApiResponse`, `DbPin`
- `apps/web/src/services/analysis.ts` の `UploadResponse`, `AnalyzeResponse`, `JobStatusResponse`
- `apps/web/src/store/types.ts` のAPI関連型

**工数見込み:** 0.5-1日

### Step 4（オプション）: `openapi-fetch` で API クライアントを型安全化

**対象:**
- `apps/web/src/services/api-client.ts` の `ApiClient` インターフェースを `openapi-fetch` ベースに置き換え
- 各 service ファイルのAPI呼び出しを型安全なクライアント経由に変更

**メリット:**
- リクエスト/レスポンスの型がパスから自動推論される
- URLのタイポがコンパイル時に検出される
- Phase 6 で導入した DI パターンは維持可能（テスト用モッククライアントも型安全に）

**工数見込み:** 1日

---

## 影響範囲と移行リスク

### 低リスク
- **Step 1**: routes の書き換えはロジックに影響しない（バリデーション + レスポンス形式は同一）
- **Step 2**: 型生成は追加的な処理で既存を壊さない

### 中リスク
- **Step 3**: フロントエンドの型置き換えは、生成型の構造が手書き型と一致するか検証が必要
- **Step 4**: API クライアント置き換えは影響範囲が広いが、テストで検証可能

### 注意事項
- `@hono/zod-openapi` は Zod v3 系を前提としているものが多い。現在のプロジェクトは **Zod v4.3.6** を使用しており、互換性を確認する必要がある
- Cloudflare Workers 環境での `openapi.json` エンドポイントの追加は、本番環境では無効にすることを推奨（ビルド時に static に生成する方式を検討）
- Python Audio Analyzer の OpenAPI Spec は FastAPI が自動生成済み（`/docs`, `/openapi.json`）なので、TypeScript 型生成パイプラインに組み込むだけで済む

---

## shared-types パッケージの役割の変化

### Before (現状)
```
shared-types = 手書き Zod スキーマ（SSoT）
```

### After (提案)
```
shared-types = 生成型（API SSoT から自動生成）+ ドメイン型（手書き維持）
```

**手書きとして残すもの:**
- `LocationCoordinates`, `MapBounds` — UIレイヤーでも使うドメイン型
- `WeatherData` — 外部API（Open-Meteo）のレスポンス型
- `ERROR_CODES` — 定数値はOpenAPIから生成できないため
- `TimeTag` — アプリケーション固有のドメインenum

**生成に置き換えるもの:**
- `SoundPinCreateRequestSchema` → Hono route 定義から生成
- `NearbyPinsQuerySchema`, `SearchPinsQuerySchema` → 同上
- `SoundPinSchema` → APIレスポンス型として生成
- `PythonAnalysisResultSchema` → Python FastAPI の OpenAPI から生成

---

## 推奨実行順序

| 順序 | 内容 | 依存関係 | 見込み工数 |
|---|---|---|---|
| Step 1 | Hono routes → `@hono/zod-openapi` 移行 | なし | 1-2日 |
| Step 2 | 型生成パイプライン構築 | Step 1 | 0.5-1日 |
| Step 3 | フロントエンド手書き型の置き換え | Step 2 | 0.5-1日 |
| Step 4 | `openapi-fetch` 導入（オプション） | Step 2 | 1日 |

**合計: 3-5日**（Step 4 はオプション）

---

## Zod v4 互換性について ✓ 確認済み

- `@hono/zod-openapi` v1.4.0 の peerDependencies: `zod: ^4.0.0` → **Zod v4 対応済み**
- 現プロジェクトの `zod: ^4.3.6` と完全互換
- `openapi-typescript` v7.13.0 も利用可能

**→ 技術的なブロッカーなし。**

---

## まとめ

| 観点 | Before | After |
|---|---|---|
| 型の源泉 | shared-types の手書き Zod | API route 定義（Hono/FastAPI） |
| フロント型 | 手書きインターフェース | openapi.json から自動生成 |
| API ↔ 型の整合性 | 手動同期（乖離リスクあり） | 自動生成（CI で検知） |
| Python ↔ TS 型共有 | 手動コピー | FastAPI openapi.json → 自動生成 |
| Swagger UI | なし | 自動で提供 |
| 開発体験 | 型を2箇所で更新 | route 定義のみ更新すれば自動反映 |
