# Docker Secrets用ディレクトリ

このディレクトリは、Docker Compose 用の機密情報（シークレット）を安全に管理するためのものです。

## セットアップ手順

1. 以下のファイルを実際のシークレット値で作成してください:
   - `supabase_service_key.txt` … Supabase サービスロールキー
   - `supabase_anon_key.txt` … Supabase 匿名キー

2. ファイルの権限を適切に設定します:
   ```bash
   chmod 600 secrets/*.txt
   ```

3. Docker Compose で利用する場合:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.secrets.yml up
   ```

## セキュリティに関する注意

- **絶対に** シークレットファイルを Git にコミットしないでください
- バージョン管理には `.gitkeep` とこの README のみを含めてください
- `secrets/*.txt` を `.gitignore` に必ず追加してください
- 本番環境では十分に強力でユニークな値を使用してください