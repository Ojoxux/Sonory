import type {
   AudioMetadata,
   AudioUploadResult,
   PythonAnalysisResult,
} from "@sonory/shared-types"
import { ERROR_CODES } from "@sonory/shared-types"
import { joinUrl } from "@sonory/utils"
import { APIException } from "../middleware/error"
import { BaseService } from "./base.service"
import { getSupabaseAdmin } from "./supabase"

/**
 * 分析ジョブのステータス型
 */
type AnalysisJobStatus = "queued" | "processing" | "completed" | "failed"

/**
 * 分析ジョブの結果型
 */
interface AnalysisJobResult {
   jobId: string
   status: AnalysisJobStatus
   estimatedDuration?: string
   statusUrl: string
}

/**
 * 分析ジョブステータスレスポンス型
 */
interface AnalysisJobStatusResponse {
   jobId: string
   status: AnalysisJobStatus
   result?: PythonAnalysisResult
   error?: {
      message: string
      code?: string
   }
   createdAt: string
   startedAt?: string
   completedAt?: string
   retryCount: number
}

/**
 * Supabase Queues (pgmq) のメッセージ型
 */
interface QueueMessage {
   audioId: string
   audioUrl: string
   retryCount?: number
   metadata?: Record<string, unknown>
}

/**
 * Supabase Queuesから読み取ったメッセージ型
 */
interface QueueReadMessage {
   msg_id: number
   read_ct: number
   enqueued_at: string
   vt: string
   message: QueueMessage
}

/**
 * 分析結果テーブルのレコード型
 */
interface AnalysisResultRecord {
   message_id: number
   audio_id: string
   status: AnalysisJobStatus
   result: PythonAnalysisResult | null
   error_message: string | null
   error_code: string | null
   retry_count: number
   created_at: string
   started_at: string | null
   completed_at: string | null
   metadata: Record<string, unknown> | null
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
   private readonly queueName = "audio-analysis"
   private readonly maxRetries = 3
   private readonly visibilityTimeout = 60 // 60秒

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

         // 署名付きURLは保存せず、ファイルパスのみを保存
         // 実際のURLはPin取得時に動的に生成される（pin.repository.tsで実装済み）
         // プレースホルダーとしてファイルパスをURLフィールドに設定
         const placeholderUrl = `storage://${this.bucketName}/${filePath}`

         // メタデータを構築
         const metadata: AudioMetadata = {
            id: data.id || filePath,
            filename: fileName,
            size: file.size,
            format: this.extractFormat(file),
            duration: 0, // 実際の長さは後で更新
            url: placeholderUrl, // プレースホルダー（実際のURLは取得時に生成）
            uploadedAt: new Date().toISOString(),
         }

         const result: AudioUploadResult = {
            audioId: data.id || filePath,
            audioUrl: placeholderUrl, // プレースホルダー（実際のURLは取得時に生成）
            audioFilePath: filePath, // Permanent file path for storage
            metadata,
         }

         this.log("info", "Audio upload completed", {
            audioId: result.audioId,
            audioUrl: result.audioUrl,
            audioFilePath: result.audioFilePath,
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
    * 音声分析ジョブをSupabase Queuesに投入（非同期）
    * Cloudflare Workersの30秒制限に対応した非同期処理
    *
    * @param audioId - 分析対象の音声ID
    * @param audioUrl - 分析対象の音声URL（公開アクセス可能）
    * @returns 分析ジョブの情報
    */
   async scheduleAnalysis(
      audioId: string,
      audioUrl: string,
   ): Promise<AnalysisJobResult> {
      try {
         this.log("info", "Scheduling audio analysis job", {
            audioId,
            audioUrl,
         })

         // audioUrlからファイルパスを抽出して新しいSigned URLを生成
         // これにより、古いSigned URLの有効期限切れやプレースホルダーURLを回避
         let analysisAudioUrl = audioUrl
         let filePath: string | null = null

         // プレースホルダーURL (storage://bucket/path) からファイルパスを抽出
         if (audioUrl.startsWith("storage://")) {
            const match = audioUrl.match(/^storage:\/\/[^/]+\/(.+)$/)
            filePath = match?.[1] ?? null
            this.log("info", "Extracted file path from placeholder URL", {
               originalUrl: audioUrl,
               filePath,
            })
         } else {
            // HTTP/HTTPS URLからファイルパスを抽出
            try {
               const urlObj = new URL(audioUrl)
               const pathMatch = urlObj.pathname.match(
                  /\/object\/(?:sign|public)\/([^?]+)/,
               )
               if (pathMatch?.[1]) {
                  filePath = pathMatch[1].replace(`${this.bucketName}/`, "")
                  this.log("info", "Extracted file path from HTTP URL", {
                     originalUrl: audioUrl,
                     filePath,
                  })
               }
            } catch (urlError) {
               this.log("warn", "Failed to parse URL", {
                  error:
                     urlError instanceof Error
                        ? urlError.message
                        : String(urlError),
               })
            }
         }

         // ファイルパスが抽出できた場合、新しいSigned URLを生成
         if (filePath) {
            try {
               const { data: signedData, error: signedError } =
                  await this.supabaseClient.storage
                     .from(this.bucketName)
                     .createSignedUrl(filePath, 7200) // 2時間

               if (!signedError && signedData) {
                  analysisAudioUrl = signedData.signedUrl
                  this.log("info", "Generated fresh signed URL for analysis", {
                     originalUrl: audioUrl,
                     newUrl: analysisAudioUrl,
                     filePath,
                  })
               } else {
                  this.log("error", "Failed to generate signed URL", {
                     error: signedError?.message,
                     filePath,
                  })
               }
            } catch (signedUrlError) {
               this.log("error", "Exception while generating signed URL", {
                  error:
                     signedUrlError instanceof Error
                        ? signedUrlError.message
                        : String(signedUrlError),
                  filePath,
               })
            }
         } else {
            this.log("warn", "Could not extract file path from URL", {
               audioUrl,
            })
         }

         // Supabase Queuesにメッセージを送信
         const message: QueueMessage = {
            audioId,
            audioUrl: analysisAudioUrl,
            retryCount: 0,
         }

         // queue_nameに指定されたキューにメッセージを追加する
         // sleep_secondsはオプショナルで表示されるまでの秒数を指定できる
         const { data, error } = await this.supabaseClient.rpc("queue_send", {
            queue_name: this.queueName,
            message: message,
            sleep_seconds: 0,
         })

         if (error) {
            this.log("error", "Failed to send message to queue", {
               error: error.message,
               audioId,
            })
            throw new APIException(
               ERROR_CODES.AI_ANALYSIS_FAILED,
               `Failed to schedule analysis: ${error.message}`,
               500,
            )
         }

         const messageId = data as number
         const statusUrl = `/api/audio/${audioId}/analysis/${messageId}/status`

         this.log("info", "Analysis job scheduled successfully", {
            messageId,
            audioId,
            statusUrl,
         })

         return {
            jobId: String(messageId),
            status: "queued",
            estimatedDuration: "15-30 seconds",
            statusUrl,
         }
      } catch (error) {
         this.log("error", "Failed to schedule analysis job", {
            audioId,
            error: error instanceof Error ? error.message : String(error),
         })

         if (error instanceof APIException) {
            throw error
         }

         throw new APIException(
            ERROR_CODES.AI_ANALYSIS_FAILED,
            "Failed to schedule audio analysis",
            500,
            error instanceof Error ? { message: error.message } : undefined,
         )
      }
   }

   /**
    * 分析ジョブのステータスを取得
    *
    * @param messageId - Supabase QueuesのメッセージID
    * @returns ジョブのステータスと結果
    */
   async getAnalysisStatus(
      messageId: string,
   ): Promise<AnalysisJobStatusResponse> {
      try {
         this.log("info", "Fetching analysis job status", { messageId })

         const messageIdNum = Number.parseInt(messageId, 10)

         if (Number.isNaN(messageIdNum)) {
            throw new APIException(
               ERROR_CODES.AI_ANALYSIS_FAILED,
               "Invalid message ID",
               400,
            )
         }

         // 分析結果テーブルから結果を取得
         const { data: result } = await this.supabaseClient
            .from("analysis_results")
            .select("*")
            .eq("message_id", messageIdNum)
            .maybeSingle()

         // 結果が存在する場合（処理済み）
         if (result) {
            const analysisResult = result as AnalysisResultRecord

            const response: AnalysisJobStatusResponse = {
               jobId: String(analysisResult.message_id),
               status: analysisResult.status,
               createdAt: analysisResult.created_at,
               retryCount: analysisResult.retry_count,
            }

            // オプショナルなフィールドを条件付きで追加
            if (analysisResult.started_at) {
               response.startedAt = analysisResult.started_at
            }
            if (analysisResult.completed_at) {
               response.completedAt = analysisResult.completed_at
            }

            // 完了時は結果を含める
            if (
               analysisResult.status === "completed" &&
               analysisResult.result
            ) {
               response.result = analysisResult.result
            }

            // エラー時はエラー情報を含める
            if (
               analysisResult.status === "failed" &&
               analysisResult.error_message
            ) {
               response.error = {
                  message: analysisResult.error_message,
               }
               if (analysisResult.error_code) {
                  response.error.code = analysisResult.error_code
               }
            }

            this.log("info", "Analysis job status fetched from results table", {
               messageId,
               status: analysisResult.status,
            })

            return response
         }

         // 結果がない場合、キューにメッセージが残っているか確認
         // NOTE: pgmq_public.readはクライアント側から直接呼び出せないため、
         // 結果テーブルにレコードがない場合は"queued"として扱う
         this.log("info", "Analysis job still in queue", { messageId })

         return {
            jobId: messageId,
            status: "queued",
            createdAt: new Date().toISOString(),
            retryCount: 0,
         }
      } catch (error) {
         this.log("error", "Failed to fetch analysis job status", {
            messageId,
            error: error instanceof Error ? error.message : String(error),
         })

         if (error instanceof APIException) {
            throw error
         }

         throw new APIException(
            ERROR_CODES.AI_ANALYSIS_FAILED,
            "Failed to fetch analysis status",
            500,
            error instanceof Error ? { message: error.message } : undefined,
         )
      }
   }

   /**
    * キューから分析ジョブを取得して実行（Worker/Cron用）
    * この関数は定期的に実行され、キュー内のジョブを処理します
    *
    * @returns 処理されたジョブの数
    */
   async processAnalysisQueue(): Promise<number> {
      try {
         this.log("info", "Starting analysis queue processing")

         // queue_nameに指定されたキューからメッセージを読み取る
         // sleep_secondsはオプショナルで表示されるまでの秒数を指定できる
         // nは読み取るメッセージの最大数を指定できる
         const { data: messages, error } = await this.supabaseClient.rpc(
            "queue_read",
            {
               queue_name: this.queueName,
               sleep_seconds: this.visibilityTimeout,
               n: 3,
            },
         )

         if (error) {
            this.log("error", "Failed to read messages from queue", {
               error: error.message,
            })
            return 0
         }

         if (!messages || messages.length === 0) {
            this.log("info", "No messages found in queue")
            return 0
         }

         const queueMessages = messages as QueueReadMessage[]
         let processedCount = 0

         // 各メッセージを並行処理
         await Promise.all(
            queueMessages.map(async (msg) => {
               try {
                  await this.executeAnalysisJob(msg)
                  processedCount++
               } catch (error) {
                  this.log("error", "Failed to execute analysis job", {
                     messageId: msg.msg_id,
                     error:
                        error instanceof Error ? error.message : String(error),
                  })
               }
            }),
         )

         this.log("info", "Analysis queue processing completed", {
            processedCount,
            totalMessages: queueMessages.length,
         })

         return processedCount
      } catch (error) {
         this.log("error", "Analysis queue processing failed", {
            error: error instanceof Error ? error.message : String(error),
         })
         return 0
      }
   }

   /**
    * 個別の分析ジョブを実行
    *
    * @param queueMessage - 実行するキューメッセージ
    */
   private async executeAnalysisJob(
      queueMessage: QueueReadMessage,
   ): Promise<void> {
      const messageId = queueMessage.msg_id
      const message = queueMessage.message
      const retryCount = message.retryCount || 0

      try {
         // 分析結果テーブルに処理中レコードを挿入
         await this.supabaseClient.from("analysis_results").upsert({
            message_id: messageId,
            audio_id: message.audioId,
            status: "processing",
            retry_count: retryCount,
            started_at: new Date().toISOString(),
         })

         this.log("info", "Executing analysis job", {
            messageId,
            audioId: message.audioId,
            audioUrl: message.audioUrl,
         })

         // Python YAMNet分析を実行
         const analysisResult = await this.analyzeAudioWithPython(
            message.audioUrl,
            5,
         )

         // 分析結果を更新
         await this.supabaseClient
            .from("analysis_results")
            .update({
               status: "completed",
               result: analysisResult,
               completed_at: new Date().toISOString(),
            })
            .eq("message_id", messageId)

         // キューからメッセージを削除
         await this.supabaseClient.rpc("queue_delete", {
            queue_name: this.queueName,
            message_id: messageId,
         })

         this.log("info", "Analysis job completed successfully", {
            messageId,
            audioId: message.audioId,
         })
      } catch (error) {
         const errorMessage =
            error instanceof Error ? error.message : String(error)
         const errorCode =
            error instanceof APIException
               ? error.code
               : ERROR_CODES.AI_ANALYSIS_FAILED

         this.log("error", "Analysis job execution failed", {
            messageId,
            error: errorMessage,
            retryCount,
         })

         // リトライ可能かチェック
         const canRetry = retryCount < this.maxRetries

         if (canRetry) {
            await this.supabaseClient.from("analysis_results").upsert({
               message_id: messageId,
               audio_id: message.audioId,
               status: "queued",
               retry_count: retryCount + 1,
               started_at: null,
               completed_at: null,
               error_message: null,
               error_code: null,
            })

            // メッセージを再キュー（リトライカウント増加）
            const retryMessage: QueueMessage = {
               ...message,
               retryCount: retryCount + 1,
            }

            await this.supabaseClient.rpc("queue_send", {
               queue_name: this.queueName,
               message: retryMessage,
               sleep_seconds: 10, // 10秒後に再試行
            })

            // 元のメッセージを削除
            await this.supabaseClient.rpc("queue_delete", {
               queue_name: this.queueName,
               message_id: messageId,
            })

            this.log("info", "Analysis job re-queued for retry", {
               messageId,
               retryCount: retryCount + 1,
            })
         } else {
            // 最大リトライ回数に達したら失敗として記録
            await this.supabaseClient.from("analysis_results").upsert({
               message_id: messageId,
               audio_id: message.audioId,
               status: "failed",
               error_message: errorMessage,
               error_code: errorCode,
               retry_count: retryCount,
               completed_at: new Date().toISOString(),
            })

            // キューからメッセージを削除
            await this.supabaseClient.rpc("queue_delete", {
               queue_name: this.queueName,
               message_id: messageId,
            })

            this.log("error", "Analysis job failed after max retries", {
               messageId,
               retryCount,
            })
         }
      }
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
