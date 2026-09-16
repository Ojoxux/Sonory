/** アプリの一行説明（`app/layout.tsx` の `metadata.description` と揃える） */
export const APP_DESCRIPTION =
   "周りの音を録音して、AI が分析し、時間・天気と一緒に記録するアプリ"

/** ライブラリクレジット1件分のデータ */
interface LibraryCredit {
   name: string
   description: string
}

/** アプリ情報シートに表示する主要ライブラリのクレジット */
export const LIBRARY_CREDITS: LibraryCredit[] = [
   { name: "Next.js", description: "Webフロントエンドフレームワーク" },
   { name: "Mapbox GL JS", description: "地図表示" },
   { name: "Supabase", description: "DB・認証・Realtime" },
   { name: "YAMNet (TensorFlow)", description: "環境音の分類" },
]

/** リポジトリへのリンク */
export const REPOSITORY_URL = "https://github.com/Ojoxux/Sonory"
