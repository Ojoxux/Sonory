import { ERROR_CODES } from '@sonory/shared-types'
import { Hono } from 'hono'
import type { Env } from '../index'
import { APIException } from '../middleware/error'
import { rateLimits } from '../middleware/rateLimit'
import { AudioService } from '../services/audio.service'

const app = new Hono<{ Bindings: Env }>()

/**
 * POST /api/audio/upload
 * @description 音声ファイルをアップロード
 * @tags Audio
 * @param {File} file - アップロードする音声ファイル（FormData）
 * @param {string} [userId] - ユーザーID（オプション）
 * @returns {AudioUploadResult} アップロード結果
 */
app.post('/upload', rateLimits.audioUpload, async c => {
   const audioService = new AudioService(c)

   try {
      // FormDataからファイルを取得
      const formData = await c.req.formData()
      const fileEntry = formData.get('audio')
      const userIdEntry = formData.get('userId')

      // ファイルの型チェック
      const file =
         fileEntry && typeof fileEntry === 'object' && 'name' in fileEntry
            ? (fileEntry as File)
            : null
      const userId = typeof userIdEntry === 'string' ? userIdEntry : null

      // ファイルの存在確認
      if (!file) {
         throw new APIException(ERROR_CODES.INVALID_AUDIO_FORMAT, 'Audio file is required', 400)
      }

      // ファイルサイズの基本チェック
      if (file.size === 0) {
         throw new APIException(ERROR_CODES.INVALID_AUDIO_FORMAT, 'Audio file cannot be empty', 400)
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
         'Failed to upload audio file',
         500,
         error instanceof Error ? { message: error.message } : undefined
      )
   }
})

/**
 * DELETE /api/audio/:audioId
 * @description 音声ファイルを削除
 * @tags Audio
 * @param {string} audioId - 削除する音声ファイルのID
 * @returns {boolean} 削除成功可否
 */
app.delete('/:audioId', rateLimits.default, async c => {
   const audioService = new AudioService(c)
   const audioId = c.req.param('audioId')

   try {
      if (!audioId) {
         throw new APIException(ERROR_CODES.INVALID_AUDIO_FORMAT, 'Audio ID is required', 400)
      }

      // TODO: 実際のファイルパス取得ロジックを実装
      // 現在は簡易的な実装
      const filePath = audioId

      const success = await audioService.deleteAudio(filePath)

      return c.json({
         success: true,
         data: { deleted: success },
      })
   } catch (error) {
      if (error instanceof APIException) {
         throw error
      }

      throw new APIException(
         ERROR_CODES.STORAGE_ERROR,
         'Failed to delete audio file',
         500,
         error instanceof Error ? { message: error.message } : undefined
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
app.get('/:audioId/metadata', rateLimits.default, async c => {
   const audioId = c.req.param('audioId')

   try {
      if (!audioId) {
         throw new APIException(ERROR_CODES.INVALID_AUDIO_FORMAT, 'Audio ID is required', 400)
      }

      // TODO: データベースからメタデータを取得するロジックを実装
      // 現在は簡易的な実装
      const metadata = {
         id: audioId,
         filename: `audio-${audioId}`,
         size: 0,
         format: 'webm' as const,
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
         'Failed to get audio metadata',
         500,
         error instanceof Error ? { message: error.message } : undefined
      )
   }
})

/**
 * POST /api/audio/:audioId/analyze
 * @description 音声ファイルをAI分析（YAMNet結果受信）
 * @tags Audio
 * @param {string} audioId - 分析する音声ファイルのID
 * @param {object} classification - フロントエンドからのYAMNet分析結果
 * @returns {AIAnalysisResult} AI分析結果
 */
app.post('/:audioId/analyze', rateLimits.default, async c => {
   const audioId = c.req.param('audioId')

   try {
      if (!audioId) {
         throw new APIException(ERROR_CODES.INVALID_AUDIO_FORMAT, 'Audio ID is required', 400)
      }

      // フロントエンドからのYAMNet分析結果を取得
      const body = await c.req.json().catch(() => ({}))
      const clientClassification = body.classification

      // YAMNet分析結果を保存用に整形
      const analysisResult = {
         transcription: 'YAMNet音響分類完了',
         categories: {
            emotion: 'N/A',
            topic: clientClassification?.primarySound?.label || '環境音',
            language: 'N/A',
            confidence: clientClassification?.primarySound?.confidence || 0.0,
         },
         summary: `検出された音: ${
            clientClassification?.primarySound?.label || '不明'
         } (信頼度: ${Math.round((clientClassification?.primarySound?.confidence || 0) * 100)}%)`,
         environment: clientClassification?.environment || 'unknown',
         allClassifications: clientClassification?.allClassifications || [],
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
         'Failed to analyze audio',
         500,
         error instanceof Error ? { message: error.message } : undefined
      )
   }
})

export default app
