"use client"

/**
 * 音声分析のReact Queryミューテーションフック
 *
 * 音声アップロード・AI分析をReact Queryで統一管理
 */

import type { UseMutationResult } from "@tanstack/react-query"
import { useMutation } from "@tanstack/react-query"
import type { AudioData, InferenceResult } from "../store/types"
import { useInferenceStore } from "../store/useInferenceStore"

/**
 * 音声AI推論ミューテーション
 *
 * useInferenceStoreの startInference をラップし、
 * React Queryのミューテーションステート管理と統合
 */
export function useStartInference(): UseMutationResult<void, Error, AudioData> {
   return useMutation({
      mutationFn: async (audioData: AudioData) => {
         const store = useInferenceStore.getState()
         await store.startInference(audioData)
      },
   })
}

/**
 * バックエンド音声分析ミューテーション
 */
export function useAnalyzeAudio(): UseMutationResult<
   InferenceResult[],
   Error,
   { audioId: string; audioUrl: string }
> {
   return useMutation({
      mutationFn: async ({ audioId, audioUrl }) => {
         const store = useInferenceStore.getState()
         return store.analyzeAudioWithBackend(audioId, audioUrl)
      },
   })
}
