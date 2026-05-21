"use client"

/**
 * ピン操作のReact Queryミューテーションフック
 *
 * ピン作成・音声アップロード等の書き込み操作をReact Queryで統一管理し、
 * 成功時にキャッシュを自動で無効化する
 */

import type { UseMutationResult } from "@tanstack/react-query"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { InferenceResult } from "../store/types"
import type { LocationData, SoundPin } from "../store/useSoundPinStore"
import { useSoundPinStore } from "../store/useSoundPinStore"

interface CreatePinParams {
   audioUrl: string
   location: LocationData
   analysisResult: InferenceResult[]
   duration?: number
}

/**
 * ピン作成ミューテーション
 *
 * 成功時に周辺ピンのキャッシュを自動で無効化し、
 * React Queryのキャッシュと同期を保つ
 */
export function useCreatePin(): UseMutationResult<
   SoundPin,
   Error,
   CreatePinParams
> {
   const queryClient = useQueryClient()

   return useMutation({
      mutationFn: async (params: CreatePinParams) => {
         const store = useSoundPinStore.getState()
         return store.createPersistentPin(
            params.audioUrl,
            params.location,
            params.analysisResult,
            params.duration,
         )
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["pins"] })
      },
   })
}

/**
 * ピン削除ミューテーション
 */
export function useDeletePin(): UseMutationResult<void, Error, string> {
   const queryClient = useQueryClient()

   return useMutation({
      mutationFn: async (pinId: string) => {
         const store = useSoundPinStore.getState()
         store.removePin(pinId)
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["pins"] })
      },
   })
}
