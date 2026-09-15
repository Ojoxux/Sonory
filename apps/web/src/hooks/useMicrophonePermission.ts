"use client"

import { useCallback, useEffect, useState } from "react"
import type { MicrophonePermissionState } from "@/utils/microphone"
import {
   getMicrophonePermissionState,
   requestMicrophonePermission,
} from "@/utils/microphone"

/**
 * マイク権限の状態と要求を扱うフック
 *
 * `request` は拒否された場合も例外を投げ直す。呼び出し側で文言を出し分けるため。
 */
export function useMicrophonePermission(): {
   state: MicrophonePermissionState
   request: () => Promise<void>
} {
   const [state, setState] = useState<MicrophonePermissionState>("unknown")

   useEffect(() => {
      let cancelled = false

      void getMicrophonePermissionState().then((initial) => {
         if (!cancelled && initial !== "unknown") {
            setState(initial)
         }
      })

      return () => {
         cancelled = true
      }
   }, [])

   const request = useCallback(async (): Promise<void> => {
      setState("requesting")
      try {
         await requestMicrophonePermission()
         setState("granted")
      } catch (error) {
         setState(
            error instanceof Error && error.name === "NotAllowedError"
               ? "denied"
               : "unknown",
         )
         throw error
      }
   }, [])

   return { state, request }
}
