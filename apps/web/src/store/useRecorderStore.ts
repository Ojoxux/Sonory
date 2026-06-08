import type { UploadAudioResponse } from "@sonory/shared-types"
import { create } from "zustand"
import type { AudioData, RecorderState } from "./types"

/**
 * 音声メタデータの型定義
 *
 * @description
 * アップロード時に必要な音声ファイルのメタデータ
 */
interface AudioMetadata {
   duration: number
   location?: {
      lat: number
      lng: number
      accuracy?: number
   }
}

/**
 * FormDataを作成する
 */
function createUploadFormData(
   audioBlob: Blob,
   metadata: AudioMetadata,
): FormData {
   const formData = new FormData()
   formData.append("audio", audioBlob, `audio-${Date.now()}.webm`)

   if (metadata.location) {
      formData.append(
         "metadata",
         JSON.stringify({
            location: metadata.location,
            duration: metadata.duration,
         }),
      )
   }

   return formData
}

/**
 * アップロードレスポンスを検証する
 */
function validateUploadResponse(
   result: unknown,
): Pick<UploadAudioResponse["data"], "audioUrl" | "audioId"> {
   if (
      typeof result !== "object" ||
      result === null ||
      !("success" in result) ||
      result.success !== true ||
      !("data" in result) ||
      typeof result.data !== "object" ||
      result.data === null
   ) {
      throw new Error("アップロード結果が不正です")
   }

   const data = result.data as Record<string, unknown>
   const audioUrl = data.audioUrl
   const audioId = data.audioId

   if (typeof audioUrl !== "string" || typeof audioId !== "string") {
      console.error("❌ アップロードレスポンスに必要な値が含まれていません:", {
         audioUrl,
         audioId,
         fullResponse: result,
      })
      throw new Error("アップロードレスポンスが不完全です")
   }

   return { audioUrl, audioId }
}

/**
 * 録音機能を管理するZustandストア
 *
 * 録音の開始、停止、一時停止、再開、リセットなどの機能を提供します。
 * MediaRecorder APIを使用して録音を行い、Supabase Storageへのアップロード機能も含みます。
 */
export const useRecorderStore = create<RecorderState>((set, _get) => ({
   // 初期状態
   status: "idle",
   audioData: null,
   elapsedTime: 0,
   uploadStatus: "idle",
   uploadProgress: 0,
   uploadError: null,
   uploadedAudioUrl: null,
   uploadedAudioId: null,

   /**
    * 録音を開始します
    *
    * 録音状態を'recording'に設定し、経過時間をリセットします
    * 実際の録音開始処理はUIコンポーネント側で行う必要があります
    */
   startRecording: () => {
      set({ status: "recording", elapsedTime: 0 })
   },

   /**
    * 録音を停止します
    *
    * 録音状態を'completed'に設定します
    * すでに完了状態の場合は何も行いません
    */
   stopRecording: () => {
      set((state) => {
         // すでに完了状態の場合は何もしない
         if (state.status === "completed") return state

         return { status: "completed" }
      })
   },

   /**
    * 録音を一時停止します
    *
    * 録音状態を'paused'に設定します
    * 録音中の場合のみ一時停止可能です
    */
   pauseRecording: () => {
      set((state) => {
         // 録音中の場合のみ一時停止可能
         if (state.status !== "recording") return state

         return { status: "paused" }
      })
   },

   /**
    * 一時停止中の録音を再開します
    *
    * 録音状態を'recording'に戻します
    * 一時停止中の場合のみ再開可能です
    */
   resumeRecording: () => {
      set((state) => {
         // 一時停止中の場合のみ再開可能
         if (state.status !== "paused") return state

         return { status: "recording" }
      })
   },

   /**
    * 録音データと状態をリセットします
    *
    * 録音状態を'idle'に戻し、録音データと経過時間をクリアします
    * 新しい録音を開始する前に使用します
    */
   resetRecording: () => {
      set({
         status: "idle",
         audioData: null,
         elapsedTime: 0,
         uploadStatus: "idle",
         uploadProgress: 0,
         uploadError: null,
         uploadedAudioUrl: null,
         uploadedAudioId: null,
      })
   },

   /**
    * 録音の経過時間を更新します
    *
    * 録音中のタイマー処理から定期的に呼び出されます
    *
    * @param time - 更新する経過時間（ミリ秒）
    */
   updateElapsedTime: (time: number) => {
      set({ elapsedTime: time })
   },

   /**
    * 録音データを設定します
    *
    * 録音完了時に生成された音声データを保存します
    *
    * @param data - 設定する音声データオブジェクト
    */
   setAudioData: (data: AudioData) => {
      set({ audioData: data })
   },

   /**
    * 音声をバックエンドAPI経由でアップロード
    * @param audioBlob - アップロードする音声Blob
    * @param metadata - 音声メタデータ
    * @returns アップロード結果
    */
   uploadAudioToStorage: async (
      audioBlob: Blob,
      metadata: AudioMetadata,
   ): Promise<{ url: string; id: string }> => {
      try {
         set({
            uploadStatus: "uploading",
            uploadProgress: 0,
            uploadError: null,
         })

         const formData = createUploadFormData(audioBlob, metadata)

         console.log("🔄 音声アップロード実行中...", {
            endpoint: "/api/audio/upload",
            blobSize: audioBlob.size,
            hasMetadata: !!metadata.location,
         })

         const response = await fetch("/api/audio/upload", {
            method: "POST",
            body: formData,
         })

         console.log("📡 アップロードレスポンス受信:", {
            status: response.status,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries()),
         })

         if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error("❌ アップロードエラー:", {
               status: response.status,
               errorData,
            })
            throw new Error(
               (errorData as { message?: string })?.message ||
                  `アップロード失敗: ${response.status}`,
            )
         }

         const result = await response.json()
         console.log("📤 アップロードレスポンス:", result)

         const { audioUrl, audioId } = validateUploadResponse(result)

         console.log("✅ アップロード成功:", { url: audioUrl, id: audioId })

         set({
            uploadStatus: "success",
            uploadProgress: 100,
            uploadedAudioUrl: audioUrl,
            uploadedAudioId: audioId,
         })

         return { url: audioUrl, id: audioId }
      } catch (error) {
         const errorMessage =
            error instanceof Error
               ? error.message
               : "アップロードに失敗しました"

         set({
            uploadStatus: "error",
            uploadError: errorMessage,
            uploadProgress: 0,
         })

         throw new Error(errorMessage)
      }
   },

   /**
    * アップロード状態を設定
    *
    * @param status - 設定するアップロード状態
    */
   setUploadStatus: (status) => {
      set({ uploadStatus: status })
   },

   /**
    * アップロード進捗を設定
    *
    * @param progress - 進捗（0-100）
    */
   setUploadProgress: (progress) => {
      set({ uploadProgress: progress })
   },

   /**
    * アップロードエラーを設定
    *
    * @param error - エラーメッセージ
    */
   setUploadError: (error) => {
      set({ uploadError: error })
   },

   /**
    * アップロード状態をクリア
    */
   clearUploadState: () => {
      set({
         uploadStatus: "idle",
         uploadProgress: 0,
         uploadError: null,
         uploadedAudioUrl: null,
         uploadedAudioId: null,
      })
   },
}))
