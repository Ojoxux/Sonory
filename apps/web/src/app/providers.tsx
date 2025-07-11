"use client"

import { initializeNotifications } from "@/utils/notifications"
import type { PropsWithChildren } from "react"
import { useEffect } from "react"

/**
 * アプリケーション全体のプロバイダー
 *
 * @description
 * アプリケーション全体で使用するプロバイダーを管理します。
 * Phase 5Cでリアルタイム通知機能の初期化を追加しています。
 *
 * @param children - 子コンポーネント
 * @returns プロバイダーでラップされた子コンポーネント
 */
export function Providers({ children }: PropsWithChildren) {
   // 通知機能の初期化
   useEffect(() => {
      initializeNotifications().catch((error) => {
         console.error("❌ 通知機能初期化エラー:", error)
      })
   }, [])

   return <>{children}</>
}
