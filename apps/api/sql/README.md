# Supabase Database Setup

このディレクトリには、Sonory APIのデータベーススキーマ定義が含まれています。

## セットアップ手順

1. Supabaseプロジェクトを作成
2. Supabase Dashboard > SQL Editorを開く
3. 以下の順番でSQLファイルを実行：

### 1. PostGIS拡張の有効化
```sql
-- 001_enable_postgis.sql を実行
```

### 2. テーブル作成
```sql
-- 002_create_sound_pins_table.sql を実行
```

### 3. RLSポリシー設定
```sql
-- 003_sound_pins_rls_policies.sql を実行
```

## テーブル構造

### sound_pins
地理空間情報を持つ音声ピンを管理するメインテーブル

- **location**: PostGIS geography型で位置情報を保存
- **audio_***: 音声ファイルの情報
- **weather_***: 録音時の天気情報
- **ai_***: AI分析結果（非同期で更新）
- **status**: ピンの状態管理

## インデックス

- 空間インデックス: 地理空間クエリの高速化
- 時間インデックス: 時系列でのソート最適化
- 複合インデックス: よくあるクエリパターンの最適化

## 注意事項

- PostGIS拡張が必要です
- RLSが有効になっているため、適切な認証設定が必要です
- 現在はservice_roleでの操作のみ許可されています 