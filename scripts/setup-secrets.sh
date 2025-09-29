#!/bin/bash

# Docker Secretsセットアップスクリプト
# 開発用のシークレットを安全にセットアップするためのスクリプト

set -e

echo "🔐 Setting up Docker Secrets for Sonory..."

# secretsディレクトリがなければ作成
mkdir -p secrets

# .envが存在しない場合は.exampleから作成
if [ ! -f .env ]; then
    echo "📋 Creating .env from example..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your actual values"
fi

# シークレットファイルを作成する関数
create_secret() {
    local secret_name=$1
    local secret_file="secrets/${secret_name}.txt"
    local example_file="secrets/${secret_name}.txt.example"
    
    if [ -f "$secret_file" ]; then
        echo "✅ Secret already exists: $secret_name"
        return
    fi
    
    if [ -f "$example_file" ]; then
        echo "📝 Creating secret file: $secret_name"
        read -p "Enter your $secret_name: " -s secret_value
        echo
        echo "$secret_value" > "$secret_file"
        chmod 600 "$secret_file"
        echo "✅ Created: $secret_file"
    else
        echo "❌ Example file not found: $example_file"
    fi
}

# シークレットファイルの作成
echo
echo "Setting up Supabase secrets..."
create_secret "supabase_anon_key"
create_secret "supabase_service_key"

echo
echo "🎉 Secret setup complete!"
echo
echo "Next steps:"
echo "1. Verify your secrets are correct"
echo "2. Start with Docker Secrets:"
echo "   task sonory:up"
echo "   # または: docker-compose -f docker-compose.yml -f docker-compose.secrets.yml up"
echo
echo "3. For full security (with network isolation):"
echo "   docker-compose \\"
echo "     -f docker-compose.yml \\"
echo "     -f docker-compose.secrets.yml \\"
echo "     -f docker-compose.networks.yml \\"
echo "     up"