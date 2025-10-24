import { useCallback, useState } from "react"
import type { AudioData } from "@/store/types"
import { useInferenceStore } from "@/store/useInferenceStore"
import { useRecorderStore } from "@/store/useRecorderStore"
import { useSoundPinStore } from "@/store/useSoundPinStore"
import type { LocationData } from "./types"

/**
 * 音声処理（アップロード + AI分析）のカスタムフック
 *
 * @description
 * 音声のアップロードとAI分析を管理する
 * 段階的なメッセージ更新とエラーハンドリングを含む
 *
 * @returns 音声処理の状態と実行関数
 */
export const useAudioProcessing = () => {
   const {
      startInference,
      results,
      error,
      clearResults,
      fallbackUsed,
      backendAnalysisResult,
   } = useInferenceStore()
   const {
      uploadAudioToStorage,
      uploadError,
      uploadedAudioUrl,
      clearUploadState,
   } = useRecorderStore()

   const [analysisMessage, setAnalysisMessage] = useState("音声を分析中...")

   /**
    * 音声処理を実行
    *
    * @param audioData 音声データ
    * @param currentPosition 現在位置
    * @returns 処理結果（成功/失敗）
    */
   const processAudio = useCallback(
      async (
         audioData: AudioData,
         currentPosition?: LocationData | null,
      ): Promise<{ success: boolean; error?: string }> => {
         try {
            // 初期メッセージ設定
            setAnalysisMessage("音を聴いています...")

            // 音声時間を実際のBlobから計算
            const duration = await new Promise<number>((resolve) => {
               const blobUrl = URL.createObjectURL(audioData.blob)
               const audio = new Audio(blobUrl)
               audio.onloadedmetadata = () => {
                  const actualDuration = audio.duration
                  URL.revokeObjectURL(blobUrl) // メモリ解放
                  resolve(Number.isFinite(actualDuration) ? actualDuration : 10)
               }
               audio.onerror = () => {
                  URL.revokeObjectURL(blobUrl) // メモリ解放
                  resolve(10) // エラー時はデフォルト10秒
               }
            })

            console.log("🎵 録音時間チェック:", { duration })

            // 録音時間のバリデーション（9.9秒未満の場合はエラー）
            if (duration < 9.9) {
               console.error("録音時間が不足しています:", { duration })
               setAnalysisMessage(
                  `録音時間が${duration.toFixed(1)}秒のため、マップピンを作成できません。10秒の録音が必要です。`,
               )
               return {
                  success: false,
                  error: `録音時間が不足しています（${duration.toFixed(1)}秒）`,
               }
            }

            const metadata = {
               duration,
               location: currentPosition
                  ? {
                       lat: currentPosition.latitude,
                       lng: currentPosition.longitude,
                    }
                  : undefined,
            }

            // アップロードを試行（タイムアウト付き）
            let uploadResult: { url: string; id: string } | null = null
            try {
               console.log("🔄 音声アップロード開始:", {
                  blobSize: audioData.blob.size,
                  blobType: audioData.blob.type,
                  metadata,
               })

               const uploadPromise = uploadAudioToStorage(
                  audioData.blob,
                  metadata,
               )
               const timeoutPromise = new Promise<never>((_, reject) =>
                  setTimeout(
                     () => reject(new Error("アップロードタイムアウト")),
                     10000,
                  ),
               )

               uploadResult = await Promise.race([
                  uploadPromise,
                  timeoutPromise,
               ])
               console.log("✅ 音声アップロード成功:", uploadResult)
            } catch (uploadError) {
               console.warn(
                  "⚠️ アップロードに失敗しました。オフライン分析を実行します:",
                  uploadError,
               )
               // アップロードに失敗してもAI分析は続行
            }

            // 段階的にメッセージを変更（3段階）
            setTimeout(() => {
               setAnalysisMessage("パターンを探しています...")
            }, 3000)

            setTimeout(() => {
               setAnalysisMessage("もうすぐ完了です...")
            }, 6000)

            // AI分析を実行
            try {
               await startInference(audioData)
            } catch (inferenceError) {
               console.warn(
                  "⚠️ AI分析に失敗しました。フォールバック結果を使用します:",
                  inferenceError,
               )
               // フォールバック結果は useInferenceStore 内で自動的に生成される
            }

            return { success: true }
         } catch (err) {
            console.error("💥 処理に失敗しました:", err)
            return {
               success: false,
               error: err instanceof Error ? err.message : "不明なエラー",
            }
         }
      },
      [startInference, uploadAudioToStorage],
   )

   return {
      processAudio,
      analysisMessage,
      setAnalysisMessage,
      results,
      error,
      clearResults,
      fallbackUsed,
      backendAnalysisResult,
      uploadError,
      uploadedAudioUrl,
      clearUploadState,
   }
}

/**
 * ピン配置のカスタムフック
 *
 * @description
 * マップへのピン配置処理を管理する
 * アップロード済みURLの優先使用とエラーハンドリングを含む
 *
 * @returns ピン配置の状態と実行関数
 */
export const usePinPlacement = () => {
   const {
      createPersistentPin,
      pinCreationStatus,
      pinCreationError,
      clearPinCreationState,
   } = useSoundPinStore()

   /**
    * ピンを配置
    *
    * @param audioData 音声データ
    * @param uploadedAudioUrl アップロード済みURL（オプション）
    * @param currentPosition 現在位置
    * @param results AI分析結果
    * @returns 処理結果（成功/失敗）
    */
   const placePin = useCallback(
      async (
         audioData: AudioData,
         uploadedAudioUrl: string | null,
         currentPosition: LocationData,
         results: Array<{ label: string; confidence: number }>,
      ): Promise<{ success: boolean; error?: string }> => {
         if (results.length === 0) {
            console.warn("⚠️ AI分析結果が存在しません")
            return { success: false, error: "AI分析結果が存在しません" }
         }

         try {
            // アップロード済みURLを優先的に使用
            let audioUrl = uploadedAudioUrl

            // アップロード済みURLがない場合は、BlobからURLを生成（createPersistentPin内でアップロードされる）
            if (!audioUrl) {
               audioUrl = URL.createObjectURL(audioData.blob)
               console.log(
                  "⚠️ アップロード済みURLがないため、BlobからURLを生成します",
               )
            }

            console.log("📍 ピン配置開始:", {
               hasUploadedUrl: !!uploadedAudioUrl,
               audioUrl: `${audioUrl.substring(0, 100)}...`, // URLの先頭のみ表示
               position: currentPosition,
               resultsCount: results.length,
               duration: audioData.duration,
            })

            // 永続化ピンを作成
            await createPersistentPin(
               audioUrl,
               {
                  latitude: currentPosition.latitude,
                  longitude: currentPosition.longitude,
               },
               results,
               audioData.duration,
            )

            console.log("✅ ピン配置成功")
            return { success: true }
         } catch (error) {
            console.error("❌ ピン配置エラー:", error)
            return {
               success: false,
               error: error instanceof Error ? error.message : "不明なエラー",
            }
         }
      },
      [createPersistentPin],
   )

   return {
      placePin,
      pinCreationStatus,
      pinCreationError,
      clearPinCreationState,
   }
}
