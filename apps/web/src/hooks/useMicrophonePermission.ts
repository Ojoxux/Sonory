"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { MicrophonePermissionState } from "@/utils/microphone"
import {
   getMicrophonePermissionState,
   isStreamLive,
   requestMicrophoneStream,
   stopStream,
} from "@/utils/microphone"

/**
 * マイク権限の状態と要求を扱うフック
 *
 * @description
 * 許可のときに開いたストリームは止めずに保持し、`takeStream` で録音へ渡す。
 * Firefox は許可を保存しないため、ここで止めると録音開始時にもう一度ダイアログが出る。
 * `request` は拒否された場合も例外を投げ直す。呼び出し側で文言を出し分けるため
 */
export function useMicrophonePermission(): {
   state: MicrophonePermissionState
   request: () => Promise<void>
   takeStream: () => MediaStream | null
   release: () => void
} {
   const [queried, setQueried] = useState<MicrophonePermissionState>("unknown")
   const [hasStream, setHasStream] = useState(false)
   const streamRef = useRef<MediaStream | null>(null)

   useEffect(() => {
      let cancelled = false

      void getMicrophonePermissionState().then((initial) => {
         if (!cancelled && initial !== "unknown") {
            setQueried(initial)
         }
      })

      return () => {
         cancelled = true
      }
   }, [])

   const release = useCallback((): void => {
      stopStream(streamRef.current)
      streamRef.current = null
      setHasStream(false)
   }, [])

   // 画面から消えたらマイクを閉じる。使用中の表示を残さない
   useEffect(() => release, [release])

   const request = useCallback(async (): Promise<void> => {
      setQueried("requesting")
      try {
         const stream = await requestMicrophoneStream()
         streamRef.current = stream
         setHasStream(true)
         setQueried("granted")
      } catch (error) {
         setQueried(
            error instanceof Error && error.name === "NotAllowedError"
               ? "denied"
               : "unknown",
         )
         throw error
      }
   }, [])

   /** 保持しているストリームの持ち主を呼び出し側に移す。以降の停止は呼び出し側の責任 */
   const takeStream = useCallback((): MediaStream | null => {
      const stream = streamRef.current
      streamRef.current = null
      setHasStream(false)
      return isStreamLive(stream) ? stream : null
   }, [])

   // ストリームを持っているあいだは、問い合わせ結果に関わらず準備できている
   const state = hasStream ? "granted" : queried

   return { state, request, takeStream, release }
}
