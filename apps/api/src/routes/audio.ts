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
 * @description 音声ファイルをPython YAMNetで分析
 * @tags Audio
 * @param {string} audioId - 分析する音声ファイルのID
 * @param {object} [options] - 分析オプション
 * @returns {AIAnalysisResult} AI分析結果
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

      // リクエストボディから分析オプションを取得
      const body = await c.req.json().catch(() => ({}))
      const topK = body.topK || 5
      const audioUrl = body.audioUrl

      if (!audioUrl) {
         throw new APIException(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            "Audio URL is required for analysis",
            400,
         )
      }

      // Python YAMNetサービスで音声分析を実行
      const pythonAnalysisResult = await audioService.analyzeAudioWithPython(
         audioUrl,
         topK,
      )

      // 分析結果を統一形式に変換
      const analysisResult = {
         transcription: "YAMNet音響分類完了",
         categories: {
            emotion: "N/A",
            topic: pythonAnalysisResult.classifications[0]?.label || "環境音",
            language: "N/A",
            confidence:
               pythonAnalysisResult.classifications[0]?.confidence || 0.0,
         },
         summary: `検出された音: ${
            pythonAnalysisResult.classifications[0]?.label || "不明"
         } (信頼度: ${Math.round(
            (pythonAnalysisResult.classifications[0]?.confidence || 0) * 100,
         )}%)`,
         environment:
            pythonAnalysisResult.environment?.primary_type || "unknown",
         allClassifications: pythonAnalysisResult.classifications || [],
         environmentDetails: pythonAnalysisResult.environment || {},
         performanceMetrics: pythonAnalysisResult.performance_metrics || {},
      }

      // TODO: データベースに分析結果を保存
      // await saveAnalysisResult(audioId, analysisResult)

      return c.json({
         success: true,
         data: analysisResult,
      })
   } catch (error) {
      if (error instanceof APIException) {
         throw error
      }

      throw new APIException(
         ERROR_CODES.AI_ANALYSIS_FAILED,
         "Failed to analyze audio",
         500,
         error instanceof Error ? { message: error.message } : undefined,
      )
   }
})

export default app
