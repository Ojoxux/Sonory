# 🚀 Sonory - Phase 4C: Python YAMNet実装セッション

## 📋 現在の状況（Phase 4B完了）

### ✅ 完了済み項目
- **フロントエンドYAMNet削除**: TensorFlow.js実装を削除し、44個の不要パッケージを整理
- **Python基盤構築**: `apps/python-audio-analyzer/` でFastAPI + TensorFlow環境構築完了
- **型定義共有**: `packages/python-types/` でTypeScript↔Python型変換システム完成
- **モノレポ統合**: Turborepoに Python開発タスク統合済み
- **Docker環境**: マルチステージビルド + 開発環境設定完了

### 🏗️ 現在のディレクトリ構造
```
sonory/
├── apps/
│   ├── web/                    # Next.js (フォールバック分類で動作中)
│   ├── api/                    # Cloudflare Workers (ピン管理API完成)
│   └── python-audio-analyzer/  # Python基盤 ✅ (YAMNet実装待ち)
│       ├── src/main.py         # FastAPI基盤のみ
│       ├── pyproject.toml      # 依存関係定義済み
│       └── Dockerfile          # 設定完了
├── packages/
│   ├── shared-types/           # 共通型定義
│   ├── python-types/           # 型変換システム ✅
│   └── utils/                  # 共通ユーティリティ
└── DEVELOPMENT_LOG.md          # 詳細進捗記録
```

## 🎯 今回の目標（Phase 4C）

### 🔥 最優先実装: Python YAMNetサービス

#### 1. YAMNetモデル実装 (60分目標)
- `apps/python-audio-analyzer/src/models/yamnet_wrapper.py` 作成
- TensorFlow Hub からYAMNetモデル読み込み
- 音響分類実行（AudioSet 521クラス → 日本語変換）
- 環境タイプ推定（urban/natural/indoor/outdoor）

#### 2. 音声前処理パイプライン (30分目標)  
- `apps/python-audio-analyzer/src/services/audio_processor.py` 作成
- 音声ファイル読み込み（URL/バイナリ対応）
- サンプリングレート正規化（16kHz）
- YAMNet入力形式変換

#### 3. APIエンドポイント実装 (45分目標)
- `apps/python-audio-analyzer/src/api/routes.py` 作成
- `POST /analyze/audio` - 音響分析実行
- `GET /health` - ヘルスチェック  
- Pydanticバリデーション + エラーハンドリング

#### 4. main.py統合 (15分目標)
- 既存FastAPIアプリにルート統合
- 起動時モデル初期化
- ログ設定統合

## 📚 参考情報

### 重要な既存実装
- **フォールバック分類**: `apps/web/src/store/useInferenceStore.ts` で12種類の音響分類実装済み
- **型定義**: `packages/shared-types/src/api.ts` で音響分析型定義済み
- **API基盤**: `apps/api/src/routes/audio.ts` で音声アップロード完成

### 技術要件
- **Python**: 3.11+, FastAPI 0.104+, TensorFlow 2.15+
- **YAMNet**: TensorFlow Hub公式モデル使用
- **音響分類**: AudioSet 521クラス → 日本語12カテゴリ変換
- **レスポンス形式**: 信頼度・環境タイプ・処理時間を含む

### 利用可能コマンド
```bash
npm run python:dev        # 開発サーバー起動
npm run python:install    # Python依存関係インストール  
npm run generate-types    # 型定義同期
npm run dev              # 全サービス同時起動
```

## 🚨 重要な制約

1. **既存APIとの互換性**: 共通型定義（`packages/shared-types`）を厳守
2. **日本語対応**: 英語AudioSetクラス → 日本語カテゴリ変換必須
3. **Cursor Rules準拠**: TSDoc、単一責務、エラーハンドリング徹底
4. **パフォーマンス**: 10秒音声の分析を3秒以内で完了
5. **型安全性**: Pydantic + TypeScript型同期システム活用

## 🎯 成功指標

- ✅ YAMNetモデルによる音響分類実行成功
- ✅ 日本語カテゴリ変換動作
- ✅ APIエンドポイント動作確認（`POST /analyze/audio`）
- ✅ 型定義システムとの統合確認
- ✅ エラーハンドリング・ログ出力確認

## 💡 実装のヒント

1. **モデル初期化**: アプリ起動時に1回だけ実行、メモリ効率化
2. **音声前処理**: librosaでサンプリングレート変換、YAMNet形式に正規化
3. **分類結果**: 上位3-5個の結果のみ返却、信頼度しきい値設定
4. **エラー処理**: 音声読み込み失敗、モデル推論失敗を適切にハンドリング
5. **ログ**: 処理時間、エラー詳細を構造化ログで出力

---

**開始指示**: 上記要件でPython YAMNetサービスの実装を開始してください。まず `apps/python-audio-analyzer/src/models/yamnet_wrapper.py` から着手し、段階的に実装していきます。 