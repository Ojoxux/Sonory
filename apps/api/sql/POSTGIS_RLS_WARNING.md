# PostGIS spatial_ref_sys RLS警告について

## 概要

Supabaseでの開発中に以下の警告が表示される場合があります：

```
WARNING: spatial_ref_sys table has RLS enabled but no policies are defined
```

## 警告の原因

- `spatial_ref_sys`はPostGISのシステムテーブル
- 座標系定義のみを格納（機密データなし）
- `postgres`スーパーユーザーが所有者のため、通常のユーザーではRLSを変更できない

## 対応方法

### 推奨：警告を無視する

この警告は**セキュリティ上の実際のリスクではない**ため、無視しても問題ありません。

**理由：**
1. システムテーブルで機密データを含まない
2. 読み取り専用で使用される
3. アプリケーションデータではない

### 確認用クエリ

```sql
-- テーブル所有者を確認
SELECT schemaname, tablename, tableowner 
FROM pg_tables 
WHERE tablename = 'spatial_ref_sys';

-- 現在のユーザー権限を確認
SELECT current_user, session_user;

-- RLS状態を確認
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'spatial_ref_sys';
```

## 結論

現在の開発段階では対応不要。