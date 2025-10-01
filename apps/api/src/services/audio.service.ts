import { ERROR_CODES } from "@sonory/shared-types"
import type { AudioMetadata, AudioUploadResult } from "@sonory/shared-types"
import { joinUrl } from "@sonory/utils"
import { APIException } from "../middleware/error"
import { BaseService } from "./base.service"
import { getSupabaseAdmin } from "./supabase"

/**
 * Python YAMNet分析結果の型定義
 */
interface PythonAnalysisResult {
   classifications: Array<{
      label: string
      confidence: number
   }>
   environment: {
      primary_type: string
      type_scores: Record<string, number>
      description: string
   }
   performance_metrics: {
      yamnet_inference_time: number
      total_time: number
      processing_ratio: number
   }
}

/**
 * 音声ファイル処理サービス
 *
 * @description
 * Supabase Storageへの音声アップロード、削除、
 * Python YAMNetサービスとの統合分析機能を提供。
 */
export class AudioService extends BaseService {
   private readonly bucketName = "sonory-audio"
   private readonly maxFileSize = 10 * 1024 * 1024 // 10MB
   private readonly maxDuration = 600 // 10 minutes
   private readonly allowedFormats = ["webm", "mp3", "wav"] as const

   protected getServiceName(): string {
      return "AudioService"
   }

   private get supabaseClient() {
      return getSupabaseAdmin(this.env)
   }

   /**
    * 音声ファイルをSupabase Storageにアップロード
    *
    * @param file - アップロードする音声ファイル
    * @param userId - ユーザーID（オプション）
    * @returns アップロード結果
    */
   async uploadAudio(file: File, userId?: string): Promise<AudioUploadResult> {
      try {
         // ファイルバリデーション
         this.validateAudioFile(file)

         // ファイルパス生成
         const fileName = this.generateFileName(file, userId)
         const filePath = this.generateFilePath(fileName, userId)

         this.log("info", "Starting audio upload", {
            fileName,
            filePath,
            fileSize: file.size,
            fileType: file.type,
         })

         // Supabase Storageにアップロード
         const { data, error } = await this.supabaseClient.storage
            .from(this.bucketName)
            .upload(filePath, file, {
               contentType: file.type,
               upsert: false,
            })

         if (error) {
            this.log("error", "Supabase upload error", {
               error: error.message,
               filePath,
            })
            throw new APIException(
               ERROR_CODES.STORAGE_ERROR,
               `Upload failed: ${error.message}`,
               500,
            )
         }

         // 公開URLを取得
         const { data: urlData } = this.supabaseClient.storage
            .from(this.bucketName)
            .getPublicUrl(filePath)

         // メタデータを構築
         const metadata: AudioMetadata = {
            id: data.id || filePath,
            filename: fileName,
            size: file.size,
            format: this.extractFormat(file),
            duration: 0, // 実際の長さは後で更新
            url: urlData.publicUrl,
            uploadedAt: new Date().toISOString(),
         }

         const result: AudioUploadResult = {
            audioId: data.id || filePath,
            audioUrl: urlData.publicUrl,
            metadata,
         }

         this.log("info", "Audio upload completed", {
            audioId: result.audioId,
            audioUrl: result.audioUrl,
         })

         return result
      } catch (error) {
         this.log("error", "Audio upload failed", {
            error: error instanceof Error ? error.message : String(error),
         })

         if (error instanceof APIException) {
            throw error
         }

         throw new APIException(
            ERROR_CODES.STORAGE_ERROR,
            "Failed to upload audio file",
            500,
            error instanceof Error ? { message: error.message } : undefined,
         )
      }
   }

   /**
    * Supabase Storageへの直接アップロード用の署名付きURLを生成
    * この方法はCloudflare Workers向けに最適化（Workersで大きなファイルを扱わない）
    *
    * @param fileName - アップロードするファイル名
    * @param userId - ユーザーID（整理用、任意）
    * @returns 署名付きアップロードURLとメタデータ
    */
   async generateUploadUrl(
      fileName: string,
      userId?: string,
   ): Promise<{
      uploadUrl: string
      filePath: string
      expiresAt: string
      maxFileSize: number
   }> {
      try {
         // ファイルパスを生成
         const filePath = this.generateFilePath(fileName, userId)

         this.log("info", "Generating presigned upload URL", {
            fileName,
            filePath,
         })

         // 署名付きアップロードURLを作成（有効期限1時間）
         const { data, error } = await this.supabaseClient.storage
            .from(this.bucketName)
            .createSignedUploadUrl(filePath)

         if (error) {
            this.log("error", "Failed to create presigned URL", {
               error: error.message,
               filePath,
            })
            throw new APIException(
               ERROR_CODES.STORAGE_ERROR,
               `Failed to generate upload URL: ${error.message}`,
               500,
            )
         }

         // 有効期限を計算（現在時刻から1時間後）
         const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString()

         const result = {
            uploadUrl: data.signedUrl,
            filePath: filePath,
            expiresAt: expiresAt,
            maxFileSize: this.maxFileSize,
         }

         this.log("info", "Presigned upload URL generated successfully", {
            filePath,
            expiresAt,
         })

         return result
      } catch (error) {
         this.log("error", "Failed to generate presigned upload URL", {
            fileName,
            error: error instanceof Error ? error.message : String(error),
         })

         if (error instanceof APIException) {
            throw error
         }

         throw new APIException(
            ERROR_CODES.STORAGE_ERROR,
            "Failed to generate upload URL",
            500,
            error instanceof Error ? { message: error.message } : undefined,
         )
      }
   }

   /**
    * Supabase Storageから音声ファイルを削除
    *
    * @param filePath - 削除するファイルのパス
    * @returns 削除が成功した場合はtrue
    * @throws 削除エラー時はAPIException
    */
   async deleteAudio(filePath: string): Promise<boolean> {
      try {
         this.log("info", "Starting audio deletion", {
            filePath,
         })

         const { error } = await this.supabaseClient.storage
            .from(this.bucketName)
            .remove([filePath])

         if (error) {
            this.log("error", "Supabase deletion error", {
               error: error.message,
               filePath,
            })
            throw new APIException(
               ERROR_CODES.STORAGE_ERROR,
               `Deletion failed: ${error.message}`,
               500,
            )
         }

         this.log("info", "Audio deletion completed", {
            filePath,
         })

         return true
      } catch (error) {
         this.log("error", "Audio deletion failed", {
            filePath,
            error: error instanceof Error ? error.message : String(error),
         })

         if (error instanceof APIException) {
            throw error
         }

         throw new APIException(
            ERROR_CODES.STORAGE_ERROR,
            "Failed to delete audio file",
            500,
            error instanceof Error ? { message: error.message } : undefined,
         )
      }
   }

   /**
    * アップロード前に音声ファイルをバリデーション
    *
    * @param file - バリデーションするファイル
    * @throws バリデーション失敗時はAPIException
    */
   private validateAudioFile(file: File): void {
      // ファイルサイズをチェック
      if (file.size > this.maxFileSize) {
         throw new APIException(
            ERROR_CODES.AUDIO_TOO_LARGE,
            `File size exceeds limit (${this.maxFileSize / 1024 / 1024}MB)`,
            400,
         )
      }

      // ファイルフォーマットをチェック
      const format = this.detectAudioFormat(file)
      if (!this.allowedFormats.includes(format)) {
         throw new APIException(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            `Invalid audio format: ${format}. Allowed: ${this.allowedFormats.join(", ")}`,
            400,
         )
      }

      // ファイル内容をチェック（基本的なMIMEタイプ検証）
      if (!file.type.startsWith("audio/")) {
         throw new APIException(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            "File is not an audio format",
            400,
         )
      }
   }

   /**
    * ファイルから音声フォーマットを検出
    *
    * @param file - 解析するファイル
    * @returns 検出された音声フォーマット
    */
   private detectAudioFormat(file: File): "webm" | "mp3" | "wav" {
      const type = file.type.toLowerCase()
      const name = file.name.toLowerCase()

      if (type.includes("webm") || name.endsWith(".webm")) return "webm"
      if (
         type.includes("mp3") ||
         type.includes("mpeg") ||
         name.endsWith(".mp3")
      )
         return "mp3"
      if (type.includes("wav") || name.endsWith(".wav")) return "wav"

      // 拡張子によるフォールバック
      const extension = name.split(".").pop()
      if (extension === "webm") return "webm"
      if (extension === "mp3") return "mp3"
      if (extension === "wav") return "wav"

      return "webm" // デフォルトのフォールバック
   }

   /**
    * 整理されたファイルパスを生成
    *
    * @param fileName - ファイル名
    * @param userId - ユーザーID（整理用）
    * @returns 生成されたファイルパス
    */
   private generateFilePath(fileName: string, userId?: string): string {
      const date = new Date()
      const dateFolder = date.toISOString().split("T")[0] // YYYY-MM-DD
      const userFolder = userId || "anonymous"

      return `${userFolder}/${dateFolder}/${fileName}`
   }

   /**
    * ファイル名を生成
    *
    * @param file - アップロードするファイル
    * @param userId - ユーザーID（整理用）
    * @returns 生成されたファイル名
    */
   private generateFileName(file: File, userId?: string): string {
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 8)
      const extension = this.detectAudioFormat(file)
      const prefix = userId ? `user-${userId}` : "anonymous"

      return `${prefix}-${timestamp}-${randomId}.${extension}`
   }

   /**
    * 音声ファイルからメタデータを抽出
    *
    * @param file - 解析するファイル
    * @returns 基本的なメタデータ
    */
   private async extractMetadata(file: File): Promise<AudioMetadata> {
      // 基本的なメタデータ抽出
      // 注意: Workers環境ではdurationの抽出は制限あり
      // 必要に応じて高度なメタデータ抽出を実装検討

      return {
         id: file.name,
         filename: file.name,
         size: file.size,
         format: this.extractFormat(file),
         duration: 0, // 必要に応じて音声長検出を実装
         url: "", // URLは呼び出し元で指定
         uploadedAt: new Date().toISOString(),
      }
   }

   /**
    * ファイルから音声フォーマットを抽出
    *
    * @param file - 解析するファイル
    * @returns 抽出された音声フォーマット
    */
   private extractFormat(
      file: File,
   ): "webm" | "mp3" | "wav" | "mp4" | "m4a" | "flac" | "ogg" {
      const extension = this.detectAudioFormat(file)

      const formatMap: Record<
         string,
         "webm" | "mp3" | "wav" | "mp4" | "m4a" | "flac" | "ogg"
      > = {
         webm: "webm",
         wav: "wav",
         mp3: "mp3",
         mp4: "mp4",
         m4a: "m4a",
         flac: "flac",
         ogg: "ogg",
      }

      return formatMap[extension] || "webm"
   }

   /**
    * Python YAMNetサービスで音声分析を実行
    *
    * @param audioUrl - 分析対象の音声URL
    * @param topK - 返却する上位結果数（デフォルト: 5）
    * @returns YAMNet分析結果
    */
   async analyzeAudioWithPython(
      audioUrl: string,
      topK = 5,
   ): Promise<PythonAnalysisResult> {
      const pythonServiceUrl = this.env.PYTHON_AUDIO_ANALYZER_URL
      const timeout =
         Number.parseInt(this.env.PYTHON_AUDIO_ANALYZER_TIMEOUT, 10) || 30000

      // 環境変数チェック
      if (!pythonServiceUrl) {
         throw new APIException(
            ERROR_CODES.AI_SERVICE_UNAVAILABLE,
            "Python Audio Analyzer service URL not configured",
            503,
         )
      }

      try {
         this.log("info", "Starting Python YAMNet analysis", {
            audioUrl,
            pythonServiceUrl,
            topK,
         })

         // Python YAMNetサービスにリクエスト
         const analysisRequest = {
            audio_url: audioUrl,
            top_k: topK,
            max_retries: 3,
         }

         const response = await fetch(
            joinUrl(pythonServiceUrl, "/api/v1/analyze/audio"),
            {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
                  "User-Agent": "Sonory-API-Gateway/1.0",
               },
               body: JSON.stringify(analysisRequest),
               signal: AbortSignal.timeout(timeout),
            },
         )

         if (!response.ok) {
            const errorText = await response.text().catch(() => "Unknown error")
            this.log("error", "Python analysis HTTP error", {
               status: response.status,
               statusText: response.statusText,
               errorText,
            })

            throw new APIException(
               ERROR_CODES.AI_ANALYSIS_FAILED,
               `Python analysis failed: ${response.status} ${response.statusText}`,
               response.status,
            )
         }

         const analysisResult: PythonAnalysisResult = await response.json()

         this.log("info", "Python YAMNet analysis completed", {
            classificationsCount: analysisResult.classifications?.length || 0,
            primaryType: analysisResult.environment?.primary_type,
            processingTime: analysisResult.performance_metrics?.total_time,
         })

         return analysisResult
      } catch (error) {
         this.log("error", "Python YAMNet analysis failed", {
            audioUrl,
            error: error instanceof Error ? error.message : String(error),
         })

         if (error instanceof APIException) {
            throw error
         }

         // タイムアウトエラーの場合
         if (error instanceof Error && error.name === "TimeoutError") {
            throw new APIException(
               ERROR_CODES.AI_ANALYSIS_FAILED,
               "Python analysis timeout",
               504,
            )
         }

         // ネットワークエラーの場合
         if (error instanceof Error && error.message.includes("fetch")) {
            throw new APIException(
               ERROR_CODES.AI_SERVICE_UNAVAILABLE,
               "Python analysis service unavailable",
               503,
            )
         }

         throw new APIException(
            ERROR_CODES.AI_ANALYSIS_FAILED,
            `Python analysis failed: ${error instanceof Error ? error.message : String(error)}`,
            500,
         )
      }
   }
}
