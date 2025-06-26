# Sonory npmスクリプト使用ガイド

## 🚀 サービス起動コマンド

### **全サービス同時起動**
```bash
npm run start:all
# または
npm run sonory:dev
```
**起動内容**: Python音響分析(8000) + API Gateway(8787) + フロントエンド(3000)

### **個別サービス起動**
```bash
# フロントエンドのみ
npm run start:frontend

# API Gatewayのみ  
npm run start:api

# Python音響分析サービスのみ
npm run start:python

# バックエンドのみ (Python + API Gateway)
npm run start:backend
```

### **サービス停止**
```bash
npm run stop:all
# または
npm run sonory:stop
```

### **URL確認**
```bash
npm run sonory:logs
```
**出力例**:
```
📱 Frontend: http://localhost:3000
🔗 API Gateway: http://localhost:8787  
🐍 Python Audio: http://localhost:8000
```

---

## 🎯 使用例

### **1. 開発開始時**
```bash
# プロジェクトルートで実行
npm run sonory:dev

# 出力例:
# [🐍Python] INFO:     Started server process [12345]
# [🔗API] ⛅️ wrangler 3.97.0
# [📱Frontend] ▲ Next.js 15.3.2
```

### **2. 特定サービスのみテスト**
```bash
# API Gatewayとフロントエンドのみ
npm run start:backend
npm run start:frontend

# Python音響分析のみ
npm run start:python
```

### **3. 開発終了時**
```bash
npm run sonory:stop
```

---

## 🔧 各サービス詳細

### **📱 フロントエンド (port 3000)**
- **フレームワーク**: Next.js 15.3.2 with Turbopack
- **起動コマンド**: `next dev --turbopack --port 3000`
- **アクセス**: http://localhost:3000

### **🔗 API Gateway (port 8787)**  
- **プラットフォーム**: Cloudflare Workers + Hono
- **起動コマンド**: `wrangler dev src/index.ts --env development --port 8787`
- **ヘルスチェック**: http://localhost:8787/api/health

### **🐍 Python音響分析 (port 8000)**
- **フレームワーク**: FastAPI + YAMNet
- **起動コマンド**: `python3 -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000`
- **ヘルスチェック**: http://localhost:8000/health

---

## ⚡ 高速起動tips

### **事前準備**
```bash
# 依存関係の事前インストール
npm install
cd apps/python-audio-analyzer && pip install -e .[dev]
```

### **並列起動の確認**
```bash
# 起動後にプロセス確認
ps aux | grep -E "(next|wrangler|uvicorn)" | grep -v grep
```

### **ポート使用状況確認**  
```bash
lsof -i :3000,8787,8000
```

---

## 🚨 トラブルシューティング

### **ポートが使用中の場合**
```bash
# 全サービス強制停止
npm run stop:all

# 特定ポートのプロセス強制終了
lsof -ti:3000 | xargs kill -9
lsof -ti:8787 | xargs kill -9  
lsof -ti:8000 | xargs kill -9
```

### **Python依存関係エラー**
```bash
cd apps/python-audio-analyzer
pip install -e .[dev]
```

### **Cloudflare Workers環境変数エラー**
```bash
# .dev.vars ファイルの確認
ls apps/api/.dev.vars
```

### **concurrently起動エラー**
```bash
# 個別起動で問題箇所特定
npm run start:python
npm run start:api  
npm run start:frontend
```

---

## 📊 パフォーマンス最適化

### **開発環境推奨設定**
- **メモリ**: 8GB以上推奨
- **CPU**: 4コア以上推奨  
- **Node.js**: v18.0.0以上
- **Python**: 3.9以上

### **起動時間短縮**
```bash
# Turbopackでフロントエンド高速化（設定済み）
# YAMNetモデルのキャッシュ（自動）
# Cloudflare Workers local mode（設定済み）
```

---

**作成日**: 2024年12月  
**対象**: Sonory音声録音・AI分析・地図アプリ  
**モノレポ**: Next.js + Cloudflare Workers + Python YAMNet 