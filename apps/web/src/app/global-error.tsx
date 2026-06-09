"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

interface GlobalErrorProps {
   readonly error: Error & { digest?: string }
   readonly reset: () => void
}

/**
 * アプリ全体の未処理エラーを捕捉し Sentry へ送信する。
 */
export default function GlobalError({
   error,
   reset,
}: GlobalErrorProps): React.JSX.Element {
   useEffect(() => {
      Sentry.captureException(error)
   }, [error])

   return (
      <html lang="ja">
         <body>
            <main>
               <h1>問題が発生しました</h1>
               <p>しばらくしてからもう一度お試しください。</p>
               <button type="button" onClick={() => reset()}>
                  再試行
               </button>
            </main>
         </body>
      </html>
   )
}
