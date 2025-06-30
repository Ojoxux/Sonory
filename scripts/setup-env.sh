#!/bin/bash

# Sonory モノレポ環境変数セットアップスクリプト
# 各アプリケーションの環境変数テンプレートファイルを作成します

set -e

echo "🚀 Sonory 環境変数セットアップを開始します..."

# プロジェクトルートに移動
cd "$(dirname "$0")/.."

# apps/web/.env.local テンプレート作成
echo "📱 フロントエンド環境変数テンプレートを作成中..."
mkdir -p apps/web
cat > apps/web/.env.local.template << 'EOF'
# Mapbox設定（必須）
# https://account.mapbox.com/access-tokens/ から取得
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here

# Supabase設定（必須）
# https://supabase.com/dashboard/project/[project-id]/settings/api から取得
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EOF

# apps/python-audio-analyzer/.env テンプレート作成
echo "🐍 Python音声分析環境変数テンプレートを作成中..."
mkdir -p apps/python-audio-analyzer
cat > apps/python-audio-analyzer/.env.template << 'EOF'
# 開発環境設定
ENVIRONMENT=development
LOG_LEVEL=info

# Supabase設定（フロントエンドと同じプロジェクト）
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# Redis設定（ローカル開発用）
REDIS_URL=redis://localhost:6379
EOF

# セットアップ手順表示
echo ""
echo "✅ 環境変数テンプレートファイルを作成しました！"
echo ""
echo "📋 次の手順で環境変数を設定してください："
echo ""
echo "1. 📱 フロントエンド (Next.js):"
echo "   cp apps/web/.env.local.template apps/web/.env.local"
echo "   # apps/web/.env.local を編集して実際の値を設定"
echo ""
echo "2. 🐍 Python音声分析 (FastAPI):"
echo "   cp apps/python-audio-analyzer/.env.template apps/python-audio-analyzer/.env"
echo "   # apps/python-audio-analyzer/.env を編集して実際の値を設定"
echo ""
echo "3. 🔗 API (Cloudflare Workers):"
echo "   # apps/api/.dev.vars はすでに存在するので、必要に応じて編集"
echo ""
echo "💡 必要なサービス："
echo "  - Mapbox アカウント: https://account.mapbox.com/"
echo "  - Supabase プロジェクト: https://supabase.com/"
echo "  - Redis (ローカル): docker run -d -p 6379:6379 redis:alpine"
echo ""
echo "🎯 設定完了後は: npm run setup" 