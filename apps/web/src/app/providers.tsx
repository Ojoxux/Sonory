"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { PropsWithChildren } from "react"
import { useEffect, useState } from "react"
import { ensureAnonymousSession } from "@/services/supabase"
import { initializeNotifications } from "@/utils/notifications"

/**
 * アプリケーション全体のプロバイダー
 *
 * @description
 * アプリケーション全体で使用するプロバイダーを管理します。
 * Phase 5Cでリアルタイム通知機能の初期化を追加しています。
 * パフォーマンス最適化のためReact Queryを追加しました。
 * 認証 (Issue #117) の匿名サインイン初期化もここで行います。
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

   // 匿名サインインの初期化
   //
   // ログイン画面は出さず、起動時に透過的に匿名セッションを張る。
   // 録音という中核体験の手前にログイン壁を作らないための方針。
   // 失敗してもアプリは落とさない。未認証でも地図の閲覧は成立し
   // （API 側が optionalAuth）、書き込み系だけが 401 になる。
   useEffect(() => {
      ensureAnonymousSession().catch((error) => {
         console.error("❌ 匿名サインイン初期化エラー:", error)
      })
   }, [])

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
