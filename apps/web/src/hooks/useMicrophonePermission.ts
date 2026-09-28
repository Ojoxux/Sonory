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
 *
 * 「許可済み」と言えるのは、ストリームを保持しているあいだか、ブラウザが許可を
 * 保存している場合（Chromium 系の Permissions API が granted を返す）だけ。
 * 手放したあとに表示だけ残すと、録音開始時に不意にダイアログが出る。
 * `request` は拒否された場合も例外を投げ直す。呼び出し側で文言を出し分けるため
 */
export function useMicrophonePermission(): {
   state: MicrophonePermissionState
   request: () => Promise<void>
   takeStream: () => MediaStream | null
   release: () => void
} {
   const [queried, setQueried] =
      useState<Exclude<MicrophonePermissionState, "requesting">>("unknown")
   const [requesting, setRequesting] = useState(false)
   const [hasStream, setHasStream] = useState(false)
   const streamRef = useRef<MediaStream | null>(null)

   const refreshQueried = useCallback((): void => {
      void getMicrophonePermissionState().then(setQueried)
   }, [])

   useEffect(refreshQueried, [refreshQueried])

   const release = useCallback((): void => {
      stopStream(streamRef.current)
      streamRef.current = null
      setHasStream(false)
      // ブラウザが許可を保存しているかは環境による。表示は問い合わせ直した結果に戻す
      refreshQueried()
   }, [refreshQueried])

   // 画面から消えたらマイクを閉じる。使用中の表示を残さない
   useEffect(() => () => stopStream(streamRef.current), [])

   const request = useCallback(async (): Promise<void> => {
      setRequesting(true)
      try {
         const stream = await requestMicrophoneStream()
         streamRef.current = stream
         setHasStream(true)
      } catch (error) {
         if (error instanceof Error && error.name === "NotAllowedError") {
            setQueried("denied")
         }
         throw error
      } finally {
         setRequesting(false)
      }
   }, [])

   /** 保持しているストリームの持ち主を呼び出し側に移す。以降の停止は呼び出し側の責任 */
   const takeStream = useCallback((): MediaStream | null => {
      const stream = streamRef.current
      streamRef.current = null
      setHasStream(false)
      return isStreamLive(stream) ? stream : null
   }, [])

   const state: MicrophonePermissionState = hasStream
      ? "granted"
      : requesting
        ? "requesting"
        : queried

   return { state, request, takeStream, release }
}
