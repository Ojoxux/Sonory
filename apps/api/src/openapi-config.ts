/**
 * OpenAPI ドキュメント設定。
 * `/api/openapi.json` エンドポイントと静的エクスポートで共有する。
 */
export const openApiDocumentConfig = {
   openapi: "3.0.0" as const,
   info: {
      title: "Sonory API",
      version: "0.1.0",
      description:
         "音声ピン管理・AI分析のためのAPI。Hono + Cloudflare Workers上で動作。",
   },
   servers: [{ url: "http://localhost:8787", description: "ローカル開発環境" }],
}
