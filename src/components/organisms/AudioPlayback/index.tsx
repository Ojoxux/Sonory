'use client'

import { motion } from 'framer-motion'
import { MdClose } from 'react-icons/md'
import { WaveformPlayer } from '../../molecules/WaveformPlayer'
import type { AudioPlaybackProps } from './types'

/**
 * 録音完了後の音声再生コンポーネント
 *
 * @description
 * 録音が完了した音声データの再生と削除機能を提供します。
 * wavesurfer.jsを使用した波形表示と再生コントロールを含みます。
 *
 * @param audioData 再生する音声データ
 * @param onClose 閉じるボタンが押されたときのコールバック
 * @param className クラス名
 *
 * @example
 * ```tsx
 * <AudioPlayback
 *   audioData={audioData}
 *   onClose={() => setShowPlayback(false)}
 * />
 * ```
 */
export function AudioPlayback({
  audioData,
  onClose,
  className = '',
}: AudioPlaybackProps) {
  /**
   * 録音時間をフォーマット
   */
  const formatRecordedAt = (date: Date): string => {
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  if (!audioData) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 ${className}`}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">録音完了</h2>
            <p className="text-sm text-gray-500 mt-1">
              {formatRecordedAt(audioData.recordedAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
            aria-label="閉じる"
          >
            <MdClose className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* メインコンテンツ */}
        <div className="p-6">
          {/* 波形プレイヤー */}
          <div className="mb-6">
            <WaveformPlayer
              audioData={audioData}
              height={120}
              waveColor="#1f2937"
              progressColor="#dc2626"
              className="w-full"
              onReady={() => console.log('音声プレイヤーが準備完了')}
              onFinish={() => console.log('再生完了')}
            />
          </div>

          {/* アクションボタン */}
          <div className="flex">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 px-4 rounded-lg font-medium transition-colors touch-manipulation"
            >
              閉じる
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
