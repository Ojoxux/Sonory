# API環境変数設定ガイド

## 環境変数ファイル

`.dev.vars`ファイルで環境変数を管理します。

## 環境変数一覧

### 必須

- `SUPABASE_URL` - SupabaseプロジェクトURL
- `SUPABASE_ANON_KEY` - Supabase匿名キー
- `SUPABASE_SERVICE_KEY` - Supabaseサービスキー

### オプション

- `CORS_ORIGIN` - フロントエンドURL (デフォルト: `http://localhost:3000`)
- `PYTHON_AUDIO_ANALYZER_URL` - Python API URL (デフォルト: `http://localhost:8000`)
- `PYTHON_AUDIO_ANALYZER_TIMEOUT` - タイムアウト (デフォルト: `30000`ms)
- `ENVIRONMENT` - 実行環境 (デフォルト: `development`)

## セットアップ

```bash
cd apps/api
cp .dev.vars.example .dev.vars
# .dev.varsを編集してSupabaseの値を設定
npm run dev
```

## デプロイ

```bash
# ステージング
wrangler secret put SUPABASE_URL --env staging
wrangler secret put SUPABASE_ANON_KEY --env staging
wrangler secret put SUPABASE_SERVICE_KEY --env staging

# 本番
wrangler secret put SUPABASE_URL --env production
wrangler secret put SUPABASE_ANON_KEY --env production
wrangler secret put SUPABASE_SERVICE_KEY --env production
```

## 注意

- `.dev.vars`はGitにコミットされません
- シークレット情報をコミットしないでください
