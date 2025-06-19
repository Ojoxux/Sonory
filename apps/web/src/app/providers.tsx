'use client'

import { PropsWithChildren } from 'react'

/**
 * アプリケーション全体のプロバイダー
 *
 * @param children - 子コンポーネント
 * @returns プロバイダーでラップされた子コンポーネント
 */
export function Providers({ children }: PropsWithChildren) {
   return <>{children}</>
}
