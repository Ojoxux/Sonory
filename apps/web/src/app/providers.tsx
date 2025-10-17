"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { PropsWithChildren } from "react"
import { useEffect, useState } from "react"
import { initializeNotifications } from "@/utils/notifications"

/**
 * アプリケーション全体のプロバイダー
 *
 * @description
 * アプリケーション全体で使用するプロバイダーを管理します。
 * Phase 5Cでリアルタイム通知機能の初期化を追加しています。
 * パフォーマンス最適化のためReact Queryを追加しました。
 *
 * @param children - 子コンポーネント
 * @returns プロバイダーでラップされた子コンポーネント
 */
export function Providers({ children }: PropsWithChildren) {
   // React Queryのクライアントを作成
   const [queryClient] = useState(
      () =>
         new QueryClient({
            defaultOptions: {
               queries: {
                  // キャッシュ時間を5分に設定
                  staleTime: 5 * 60 * 1000,
                  // ウィンドウフォーカス時の再取得を無効化（パフォーマンス向上）
                  refetchOnWindowFocus: false,
                  // 再試行回数を1回に制限
                  retry: 1,
               },
            },
         }),
   )

   // 通知機能の初期化
   useEffect(() => {
      initializeNotifications().catch((error) => {
         console.error("❌ 通知機能初期化エラー:", error)
      })
   }, [])

   return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
   )
}
