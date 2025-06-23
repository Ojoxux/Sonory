import { ERROR_CODES } from '@sonory/shared-types'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Context } from 'hono'
import { APIException } from '../middleware/error'
import { BaseService } from './base.service'
import { getSupabaseAdmin } from './supabase'

/**
 * 音声アップロード結果の型定義
 */
export interface AudioUploadResult {
   /** アップロードされたファイルのURL */
   url: string
   /** ファイルサイズ（バイト） */
   size: number
   /** ファイル形式 */
   format: 'webm' | 'mp3' | 'wav'
   /** 音声の長さ（秒） */
   duration: number
   /** アップロード日時 */
   uploadedAt: string
}

/**
 * 音声ファイルのメタデータ
 */
export interface AudioMetadata {
   filename: string
   size: number
   type: string
   duration?: number
}

/**
 * Audio service for handling audio file operations
 *
 * @description
 * Handles audio file upload, validation, and metadata management using Supabase Storage.
 * Provides secure file upload with validation and automatic file organization.
 */
export class AudioService extends BaseService {
   private supabase: SupabaseClient
   private readonly bucketName = 'sonory-audio'
   private readonly maxFileSize = 10 * 1024 * 1024 // 10MB
   private readonly maxDuration = 600 // 10 minutes
   private readonly allowedFormats = ['webm', 'mp3', 'wav'] as const

   constructor(ctx: Context) {
      super(ctx)
      this.supabase = getSupabaseAdmin(this.env)
   }

   /**
    * Gets the service name for logging
    * @returns Service name
    */
   protected getServiceName(): string {
      return 'AudioService'
   }

   /**
    * Uploads an audio file to Supabase Storage
    *
    * @param file - Audio file to upload
    * @param userId - User ID for file organization (optional)
    * @returns Upload result with file URL and metadata
    * @throws APIException on validation or upload error
    */
   async uploadAudio(file: File, userId?: string): Promise<AudioUploadResult> {
      this.log('info', 'Starting audio upload', {
         filename: file.name,
         size: file.size,
         type: file.type,
         userId,
      })

      try {
         // Validate file
         await this.validateAudioFile(file)

         // Generate file path
         const filePath = this.generateFilePath(file, userId)

         // Upload to Supabase Storage
         const { data, error } = await this.supabase.storage
            .from(this.bucketName)
            .upload(filePath, file, {
               contentType: file.type,
               upsert: false, // Prevent overwriting
            })

         if (error) {
            throw error
         }

         // Get public URL
         const { data: urlData } = this.supabase.storage
            .from(this.bucketName)
            .getPublicUrl(data.path)

         // Extract metadata
         const metadata = await this.extractMetadata(file)

         const result: AudioUploadResult = {
            url: urlData.publicUrl,
            size: file.size,
            format: this.detectAudioFormat(file),
            duration: metadata.duration || 0,
            uploadedAt: new Date().toISOString(),
         }

         this.log('info', 'Audio upload completed', {
            url: result.url,
            size: result.size,
            duration: result.duration,
         })

         return result
      } catch (error) {
         this.log('error', 'Audio upload failed', {
            filename: file.name,
            error: error instanceof Error ? error.message : String(error),
         })

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
   }

   /**
    * Deletes an audio file from Supabase Storage
    *
    * @param filePath - Path of the file to delete
    * @returns True if deletion was successful
    * @throws APIException on deletion error
    */
   async deleteAudio(filePath: string): Promise<boolean> {
      this.log('info', 'Deleting audio file', { filePath })

      try {
         const { error } = await this.supabase.storage.from(this.bucketName).remove([filePath])

         if (error) {
            throw error
         }

         this.log('info', 'Audio file deleted', { filePath })
         return true
      } catch (error) {
         this.log('error', 'Audio deletion failed', {
            filePath,
            error: error instanceof Error ? error.message : String(error),
         })

         throw new APIException(
            ERROR_CODES.STORAGE_ERROR,
            'Failed to delete audio file',
            500,
            error instanceof Error ? { message: error.message } : undefined
         )
      }
   }

   /**
    * Validates audio file before upload
    *
    * @param file - File to validate
    * @throws APIException if validation fails
    */
   private async validateAudioFile(file: File): Promise<void> {
      // Check file size
      if (file.size > this.maxFileSize) {
         throw new APIException(
            ERROR_CODES.AUDIO_TOO_LARGE,
            `File size exceeds limit (${this.maxFileSize / 1024 / 1024}MB)`,
            400
         )
      }

      // Check file format
      const format = this.detectAudioFormat(file)
      if (!this.allowedFormats.includes(format)) {
         throw new APIException(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            `Invalid audio format: ${format}. Allowed: ${this.allowedFormats.join(', ')}`,
            400
         )
      }

      // Check file content (basic MIME type validation)
      if (!file.type.startsWith('audio/')) {
         throw new APIException(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            'File is not an audio format',
            400
         )
      }
   }

   /**
    * Detects audio format from file
    *
    * @param file - File to analyze
    * @returns Detected audio format
    */
   private detectAudioFormat(file: File): 'webm' | 'mp3' | 'wav' {
      const type = file.type.toLowerCase()
      const name = file.name.toLowerCase()

      if (type.includes('webm') || name.endsWith('.webm')) return 'webm'
      if (type.includes('mp3') || type.includes('mpeg') || name.endsWith('.mp3')) return 'mp3'
      if (type.includes('wav') || name.endsWith('.wav')) return 'wav'

      // Fallback based on file extension
      const extension = name.split('.').pop()
      if (extension === 'webm') return 'webm'
      if (extension === 'mp3') return 'mp3'
      if (extension === 'wav') return 'wav'

      return 'webm' // Default fallback
   }

   /**
    * Generates organized file path
    *
    * @param file - File being uploaded
    * @param userId - User ID for organization
    * @returns Generated file path
    */
   private generateFilePath(file: File, userId?: string): string {
      const timestamp = Date.now()
      const randomId = crypto.randomUUID().substring(0, 8)
      const format = this.detectAudioFormat(file)

      // Organize files by user and date
      const datePath = new Date().toISOString().substring(0, 10) // YYYY-MM-DD
      const userPath = userId || 'anonymous'

      return `${userPath}/${datePath}/${timestamp}-${randomId}.${format}`
   }

   /**
    * Extracts metadata from audio file
    *
    * @param file - File to analyze
    * @returns Basic metadata
    */
   private async extractMetadata(file: File): Promise<AudioMetadata> {
      // Basic metadata extraction
      // Note: Duration extraction in Workers environment is limited
      // Consider implementing advanced metadata extraction as needed

      return {
         filename: file.name,
         size: file.size,
         type: file.type,
         // duration property omitted - implement audio duration detection when needed
      }
   }
}
