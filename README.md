<div align=center>
   <img src="apps/web/public/Sonory-App-Icon-PNG.png" width="360" alt="Sonory Logo">
</div>
<div align=center>
   <a href="https://deepwiki.com/Ojoxux/Sonory"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki" />
</div>
<h1>Sonory</h1>

<p>
   Sonoryは、周囲の環境音を10秒間録音し、AIがその音を分類して地図上に記録します。<br>
   日常の一瞬を音で残します。
</p>

## 構成

| ディレクトリ                 | 内容                                              |
| ---------------------------- | ------------------------------------------------- |
| `apps/web`                   | Next.js（OpenNext + Cloudflare Workers）          |
| `apps/api`                   | Hono（Cloudflare Workers）                        |
| `apps/python-audio-analyzer` | YAMNet による環境音の分類                         |
| `apps/api/supabase`          | Supabase（PostgreSQL + PostGIS + pgmq）のスキーマ |

## ローカル起動

Node.js 22、[Task](https://taskfile.dev)、起動済みの Docker、Supabase プロジェクト（匿名サインインを有効化）が必要です。

```bash
cp .env.example .env
cp apps/api/.dev.vars.example apps/api/.dev.vars
cp apps/web/.env.example apps/web/.env.local
# それぞれに Supabase の URL とキーを設定する

task install   # 初回のみ。解析コンテナのビルドに時間がかかる
task dev
```

- Web: http://localhost:3000
- API: http://localhost:8787
- Audio Analyzer: http://localhost:8000

API と Web は Ctrl+C で止まりますが、コンテナは残るので `task down` で停止します。

開発のルールと詳細は [AGENTS.md](./AGENTS.md) を参照してください。
