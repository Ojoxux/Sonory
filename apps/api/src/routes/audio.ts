import { ERROR_CODES } from "@sonory/shared-types"
import { Hono } from "hono"
import type { Context } from "hono"
import type { Env } from "../index"
import { APIException } from "../middleware/error"
import { rateLimits } from "../middleware/rateLimit"
import { AudioService } from "../services/audio.service"

const app = new Hono<{ Bindings: Env }>()

/**
 * POST /api/audio/upload-url
 * @description Presigned URLを生成して直接Supabase Storageにアップロード
 * @tags Audio
 * @param {string} fileName - アップロードするファイル名
 * @param {string} [userId] - ユーザーID（オプション）
 * @returns {object} Presigned URLと関連情報
 */
app.post("/upload-url", rateLimits.default, async (c) => {
   const audioService = new AudioService(
      c as unknown as Context<{ Bindings: Env }>,
   )

   try {
      const body = await c.req.json()
      const fileName = body.fileName
      const userId = body.userId

      // ファイル名が存在しない場合はエラースロー
      if (!fileName) {
         throw new APIException(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            "File name is required",
            400,
         )
      }

      // Presigned URL生成
      const result = await audioService.generateUploadUrl(fileName, userId)

      return c.json({
         success: true,
         data: result,
      })
   } catch (error) {
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
})

/**
 * POST /api/audio/upload
 * @description 音声ファイルをアップロード（従来の直接アップロード方式）
 * @tags Audio
 * @param {File} file - アップロードする音声ファイル（FormData）
 * @param {string} [userId] - ユーザーID（オプション）
 * @returns {AudioUploadResult} アップロード結果
 */
app.post("/upload", rateLimits.audioUpload, async (c) => {
   const audioService = new AudioService(
      c as unknown as Context<{ Bindings: Env }>,
   )

   try {
      // FormDataからファイルを取得
      const formData = await c.req.formData()
      const fileEntry = formData.get("audio")
      const userIdEntry = formData.get("userId")

      // ファイルの型チェック
      const file =
         fileEntry && typeof fileEntry === "object" && "name" in fileEntry
            ? (fileEntry as File)
            : null
      const userId = typeof userIdEntry === "string" ? userIdEntry : null

      // ファイルの存在確認
      if (!file) {
         throw new APIException(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            "Audio file is required",
            400,
         )
      }

      // ファイルサイズの基本チェック
      if (file.size === 0) {
         throw new APIException(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            "Audio file cannot be empty",
            400,
         )
      }

      // 音声ファイルをアップロード
      const result = await audioService.uploadAudio(file, userId || undefined)

      return c.json({
         success: true,
         data: result,
      })
   } catch (error) {
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
})

/**
 * DELETE /api/audio/:filePath
 * @description 音声ファイルを削除
 * @tags Audio
 * @param {string} filePath - 削除する音声ファイルのパス（URLエンコード済み）
 * @returns {object} 削除結果
 */
app.delete("/:filePath{.+}", rateLimits.default, async (c) => {
   const audioService = new AudioService(
      c as unknown as Context<{ Bindings: Env }>,
   )
   const encodedFilePath = c.req.param("filePath")

   try {
      if (!encodedFilePath) {
         throw new APIException(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            "File path is required",
            400,
         )
      }

      // URLデコードしてファイルパスを取得
      const filePath = decodeURIComponent(encodedFilePath)

      const success = await audioService.deleteAudio(filePath)

      return c.json({
         success: true,
         data: {
            deleted: success,
            deletedPath: filePath,
         },
      })
   } catch (error) {
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
})

/**
 * GET /api/audio/:audioId/metadata
 * @description 音声ファイルのメタデータを取得
 * @tags Audio
 * @param {string} audioId - 音声ファイルのID
 * @returns {AudioMetadata} メタデータ
 */
app.get("/:audioId/metadata", rateLimits.default, async (c) => {
   const audioId = c.req.param("audioId")

   try {
      if (!audioId) {
         throw new APIException(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            "Audio ID is required",
            400,
         )
      }

      // TODO: データベースからメタデータを取得するロジックを実装
      // 現在は簡易的な実装
      const metadata = {
         id: audioId,
         filename: `audio-${audioId}`,
         size: 0,
         format: "webm" as const,
         duration: 0,
         uploadedAt: new Date().toISOString(),
      }

      return c.json({
         success: true,
         data: metadata,
      })
   } catch (error) {
      if (error instanceof APIException) {
         throw error
      }

      throw new APIException(
         ERROR_CODES.DATABASE_ERROR,
         "Failed to get audio metadata",
         500,
         error instanceof Error ? { message: error.message } : undefined,
      )
   }
})

/**
 * POST /api/audio/:audioId/analyze
 * @description 音声分析ジョブを非同期で投入（Cloudflare Workers 30秒制限対応）
 * @tags Audio
 * @param {string} audioId - 分析する音声ファイルのID
 * @param {object} body - リクエストボディ
 * @param {string} body.audioUrl - 分析対象の音声URL（公開アクセス可能）
 * @returns {object} ジョブ投入結果とステータスURL
 */
app.post("/:audioId/analyze", rateLimits.default, async (c) => {
   const audioService = new AudioService(
      c as unknown as Context<{ Bindings: Env }>,
   )
   const audioId = c.req.param("audioId")

   try {
      if (!audioId) {
         throw new APIException(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            "Audio ID is required",
            400,
         )
      }

      // リクエストボディから音声URLを取得
      const body = await c.req.json().catch(() => ({}))
      const audioUrl = body.audioUrl

      if (!audioUrl) {
         throw new APIException(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            "Audio URL is required for analysis",
            400,
         )
      }

      // 非同期分析ジョブを投入
      const jobResult = await audioService.scheduleAnalysis(audioId, audioUrl)

      // 開発環境では即座にキュー処理を実行（自動処理）
      const env = c.env as Env
      const isDevelopment =
         env.ENVIRONMENT === "development" || !env.ENVIRONMENT

      // 本番環境では Cloudflare Cron Trigger で /api/audio/internal/process-queue を定期実行する
      if (isDevelopment) {
         console.log("🔧 開発環境: 同期的にキュー処理を実行します")
         await new Promise((resolve) => setTimeout(resolve, 500))
         try {
            const processedCount = await audioService.processAnalysisQueue()
            console.log("✅ キュー処理完了", { processedCount })
         } catch (error) {
            console.error("❌ 自動キュー処理エラー:", error)
         }
      }

      return c.json({
         success: true,
         data: jobResult,
      })
   } catch (error) {
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
})

/**
 * GET /api/audio/:audioId/analysis/:jobId/status
 * @description 分析ジョブのステータスと結果を取得
 * @tags Audio
 * @param {string} audioId - 音声ファイルのID
 * @param {string} jobId - 分析ジョブのID
 * @returns {object} ジョブステータスと分析結果
 */
app.get("/:audioId/analysis/:jobId/status", rateLimits.default, async (c) => {
   const audioService = new AudioService(
      c as unknown as Context<{ Bindings: Env }>,
   )
   const audioId = c.req.param("audioId")
   const jobId = c.req.param("jobId")

   try {
      if (!audioId) {
         throw new APIException(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            "Audio ID is required",
            400,
         )
      }

      if (!jobId) {
         throw new APIException(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            "Job ID is required",
            400,
         )
      }

      // 分析ジョブのステータスを取得
      const jobStatus = await audioService.getAnalysisStatus(jobId)

      return c.json({
         success: true,
         data: jobStatus,
      })
   } catch (error) {
      if (error instanceof APIException) {
         throw error
      }

      throw new APIException(
         ERROR_CODES.AI_ANALYSIS_FAILED,
         "Failed to get analysis status",
         500,
         error instanceof Error ? { message: error.message } : undefined,
      )
   }
})

/**
 * POST /api/audio/internal/process-queue
 * @description キューから分析ジョブを取得して処理（内部用・Cron Trigger用）
 * @tags Internal
 * @returns {object} 処理結果
 */
app.post("/internal/process-queue", async (c) => {
   const audioService = new AudioService(
      c as unknown as Context<{ Bindings: Env }>,
   )

   try {
      // キューから分析ジョブを処理
      const processedCount = await audioService.processAnalysisQueue()

      return c.json({
         success: true,
         data: {
            processedCount,
            message: `Processed ${processedCount} analysis jobs`,
         },
      })
   } catch (error) {
      if (error instanceof APIException) {
         throw error
      }

      throw new APIException(
         ERROR_CODES.AI_ANALYSIS_FAILED,
         "Failed to process analysis queue",
         500,
         error instanceof Error ? { message: error.message } : undefined,
      )
   }
})

export default app
