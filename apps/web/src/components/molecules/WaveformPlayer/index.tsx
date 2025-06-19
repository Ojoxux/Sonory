'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MdPause, MdPlayArrow } from 'react-icons/md'
import WaveSurfer from 'wavesurfer.js'
import type { AudioData } from '../../../store/types'

/**
 * @typedef WaveformPlayerProps
 * @description wavesurfer.jsを使用した音声再生・波形表示コンポーネントのプロパティ型
 * @property audioData 再生する音声データ
 * @property height 波形の高さ（ピクセル）
 * @property waveColor 波形の色
 * @property progressColor 再生プログレスの色
 * @property className クラス名
 * @property onReady 初期化完了時のコールバック
 * @property onFinish 再生完了時のコールバック
 */
type WaveformPlayerProps = {
   /** 再生する音声データ */
   audioData: AudioData | null
   /** 波形の高さ（ピクセル） */
   height?: number
   /** 波形の色 */
   waveColor?: string
   /** 再生プログレスの色 */
   progressColor?: string
   /** クラス名 */
   className?: string
   /** 初期化完了時のコールバック */
   onReady?: () => void
   /** 再生完了時のコールバック */
   onFinish?: () => void
}

/**
 * wavesurfer.jsを使用した音声再生・波形表示コンポーネント
 * @param props WaveformPlayerProps
 * @returns JSX.Element
 */
export function WaveformPlayer({
   audioData,
   height = 128,
   waveColor = '#1f2937',
   progressColor = '#dc2626',
   className = '',
   onReady,
   onFinish,
}: WaveformPlayerProps) {
   // DOM参照
   const containerRef = useRef<HTMLDivElement>(null)
   const wavesurferRef = useRef<WaveSurfer | null>(null)
   const isDestroyingRef = useRef<boolean>(false)
   // 状態管理
   const [isPlaying, setIsPlaying] = useState<boolean>(false)
   const [isLoading, setIsLoading] = useState<boolean>(false)
   const [duration, setDuration] = useState<number>(0)
   const [currentTime, setCurrentTime] = useState<number>(0)
   const [error, setError] = useState<Error | null>(null)
   const [isInitialized, setIsInitialized] = useState<boolean>(false)
   const initIdRef = useRef<number>(0)
   // 定数
   const SECONDS_IN_MINUTE = 60

   /**
    * WaveSurferインスタンスを安全に破棄
    */
   const destroyWaveSurfer = useCallback((): Promise<void> => {
      return new Promise(resolve => {
         if (!wavesurferRef.current || isDestroyingRef.current) {
            resolve()
            return
         }

         try {
            isDestroyingRef.current = true
            setIsInitialized(false)

            if (wavesurferRef.current && typeof wavesurferRef.current.destroy === 'function') {
               try {
                  if (
                     wavesurferRef.current.isPlaying &&
                     typeof wavesurferRef.current.isPlaying === 'function' &&
                     wavesurferRef.current.isPlaying()
                  ) {
                     console.log('Stopping playback before destroy')
                     wavesurferRef.current.pause()
                  }
               } catch (pauseError) {
                  console.warn('Error pausing before destroy:', pauseError)
               }

               // 即座に破棄せず、少し遅延させる
               setTimeout(() => {
                  try {
                     if (wavesurferRef.current) {
                        console.log('Destroying WaveSurfer instance')

                        // すべてのイベントリスナーを先に解除
                        if (typeof wavesurferRef.current.unAll === 'function') {
                           wavesurferRef.current.unAll()
                        }

                        // 破棄処理を実行
                        wavesurferRef.current.destroy()
                     }
                  } catch (error) {
                     console.warn('WaveSurfer destroy error:', error)
                  } finally {
                     wavesurferRef.current = null
                     isDestroyingRef.current = false
                     resolve()
                  }
               }, 200) // 遅延時間を増やす
            } else {
               wavesurferRef.current = null
               isDestroyingRef.current = false
               resolve()
            }
         } catch (error) {
            console.warn('WaveSurfer destroy setup error:', error)
            wavesurferRef.current = null
            isDestroyingRef.current = false
            resolve()
         }
      })
   }, [])

   /**
    * WaveSurferインスタンスを初期化
    * - 既存インスタンスの破棄と競合防止
    * - 音声データの有効性チェック
    * - イベントリスナー登録
    */
   const initializeWaveSurfer = useCallback(async (): Promise<void> => {
      const myInitId = ++initIdRef.current
      console.log('initializeWaveSurfer called with:', {
         hasWindow: typeof window !== 'undefined',
         hasContainer: !!containerRef.current,
         hasAudioData: !!audioData,
         audioDataDetails: audioData
            ? {
                 hasBlob: !!audioData.blob,
                 hasUrl: !!audioData.url,
                 blobSize: audioData.blob?.size,
                 blobType: audioData.blob?.type,
                 url: audioData.url,
              }
            : null,
      })

      if (typeof window === 'undefined' || !containerRef.current || !audioData) {
         console.log('WaveSurfer initialization skipped:', {
            hasWindow: typeof window !== 'undefined',
            hasContainer: !!containerRef.current,
            hasAudioData: !!audioData,
         })
         return
      }

      // BlobやURLの有効性を事前にチェック
      if (!audioData.url && (!audioData.blob || audioData.blob.size === 0)) {
         setError(new Error('有効な音声データが見つかりません'))
         setIsLoading(false)
         return
      }

      try {
         console.log('Starting WaveSurfer initialization...')
         setError(null)
         setIsLoading(true)
         setIsInitialized(false)

         // 既存のインスタンスを安全に破棄（Promiseの完了を必ず待つ）
         await destroyWaveSurfer()

         // ここで新しい初期化が走っていないかチェック
         if (myInitId !== initIdRef.current) return

         // コンテナが DOM に存在することを確認
         if (!containerRef.current.isConnected) {
            console.warn('Container is not connected to DOM')
            setIsLoading(false)
            return
         }

         if (wavesurferRef.current) {
            wavesurferRef.current.unAll?.()
            wavesurferRef.current.destroy()
         }

         // WaveSurferインスタンスを作成
         const wavesurfer = WaveSurfer.create({
            container: containerRef.current,
            height,
            waveColor,
            progressColor,
            cursorColor: progressColor,
            cursorWidth: 2,
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            normalize: true,
            mediaControls: false,
            interact: true,
            hideScrollbar: true,
            fillParent: true,
            dragToSeek: true,
            autoplay: false,
            backend: 'WebAudio',
         })

         wavesurferRef.current = wavesurfer
         console.log('WaveSurfer instance created')

         // イベントリスナーを設定
         wavesurfer.on('ready', () => {
            console.log('WaveSurfer ready event fired')
            setIsLoading(false)
            setIsInitialized(true)
            const duration = wavesurfer.getDuration()
            setDuration(duration)
            console.log('Audio duration:', duration, 'WaveSurfer ready for playback')
            onReady?.()
            wavesurfer.play() // 再生を ready イベント内で確実に実行
         })

         // 再生中の現在時刻を更新
         wavesurfer.on('audioprocess', (time: number) => {
            setCurrentTime(time)
            // 終了間近になったら手動で終了処理をトリガーする
            const duration = wavesurfer.getDuration()
            if (duration > 0 && time >= duration - 0.05) {
               // すでに再生が停止していなければ、手動で停止し、終了処理を呼び出す
               if (wavesurfer.isPlaying()) {
                  console.log('WaveSurfer Manually triggering finish due to reaching end of audio')
                  wavesurfer.pause() // 再生を停止
                  setIsPlaying(false)
                  wavesurfer.seekTo(0) // 再生位置を先頭に
                  setCurrentTime(0) // UI上の時間もリセット
                  onFinish?.() // 親コンポーネントに終了を通知
               }
            }
         })

         // 再生位置が変化したときの現在時刻を更新
         wavesurfer.on('timeupdate', (time: number) => {
            setCurrentTime(time)
         })

         // 再生・一時停止状態の管理
         wavesurfer.on('play', () => {
            console.log('WaveSurfer play event fired - playback started')
            setIsPlaying(true)
         })

         wavesurfer.on('pause', () => {
            console.log('WaveSurfer pause event fired - playback paused')
            setIsPlaying(false)
         })

         wavesurfer.on('finish', () => {
            console.log('WaveSurfer finish event fired - playback completed')
            setIsPlaying(false)
            wavesurfer.seekTo(0) // ここが追加ポイント：終了時に先頭に戻す
            const finalTime = wavesurfer.getDuration()
            setCurrentTime(finalTime)
            onFinish?.()
         })

         // シーク時の再生位置更新

         wavesurfer.on('seeking', (time: number) => {
            setCurrentTime(time)
         })

         // エラー時の状態管理
         wavesurfer.on('error', (err: Error) => {
            console.error('WaveSurfer error event:', err)
            setError(err)
            setIsLoading(false)
            setIsPlaying(false)
            setIsInitialized(false)
         })

         // 音声データを読み込み
         try {
            if (audioData.url) {
               console.log('Loading audio from URL:', audioData.url)
               wavesurfer.on('ready', () => {
                  console.log('WaveSurfer ready (from URL) - auto-playing')
                  setIsLoading(false)
                  setIsInitialized(true)
                  setDuration(wavesurfer.getDuration())
                  onReady?.()
                  wavesurfer.play()
               })
               wavesurfer.load(audioData.url)
               console.log('Audio URL loaded successfully')
            } else if (audioData.blob) {
               console.log('Loading audio from blob:', audioData.blob.size, 'bytes')
               wavesurfer.on('ready', () => {
                  console.log('WaveSurfer ready (from blob)')
                  setIsLoading(false)
                  setIsInitialized(true)
                  setDuration(wavesurfer.getDuration())
                  onReady?.()
                  wavesurfer.play()
               })
               wavesurfer.loadBlob(audioData.blob)
               console.log('Audio blob loaded successfully')
            } else {
               console.error('No valid audio data found')
               setError(new Error('有効な音声データが見つかりません'))
               setIsLoading(false)
               return
            }

            console.log('Post-load WaveSurfer state:', {
               duration: wavesurfer.getDuration(),
               isReady: 'loaded',
               hasContainer: !!containerRef.current,
            })
         } catch (loadError) {
            console.error('Audio loading error:', loadError)
            setError(
               loadError instanceof Error
                  ? loadError
                  : new Error('音声データの読み込みに失敗しました')
            )
            setIsLoading(false)
         }
      } catch (err) {
         console.error('WaveSurfer initialization error:', err)
         const error = err instanceof Error ? err : new Error('WaveSurferの初期化に失敗しました')
         setError(error)
         setIsLoading(false)
      }
   }, [audioData, height, waveColor, progressColor, onReady, onFinish, destroyWaveSurfer])

   /**
    * 再生/一時停止を切り替え
    */
   const togglePlayPause = useCallback((): void => {
      console.log('togglePlayPause called:', {
         hasWaveSurfer: !!wavesurferRef.current,
         isInitialized,
         isPlaying,
         isLoading,
         currentTime,
         duration,
         isDestroying: isDestroyingRef.current,
         hasAudioData: !!audioData,
         audioDataDetails: audioData
            ? {
                 hasBlob: !!audioData.blob,
                 hasUrl: !!audioData.url,
                 blobSize: audioData.blob?.size,
                 blobType: audioData.blob?.type,
              }
            : null,
      })
      const wavesurfer = wavesurferRef.current

      if (wavesurfer && isInitialized) {
         if (wavesurfer.isPlaying()) {
            wavesurfer.pause()
            setIsPlaying(false)
         } else {
            wavesurfer.play()
            setIsPlaying(true)
         }
      } else {
         initializeWaveSurfer()
      }

      if (!wavesurferRef.current || !isInitialized) {
         console.warn(
            'WaveSurfer instance not available or not initialized - attempting to reinitialize'
         )
         if (audioData) {
            initializeWaveSurfer().catch(error => {
               console.error('Failed to reinitialize WaveSurfer:', error)
            })
         }
         return
      }

      try {
         console.log('WaveSurfer instance state:', {
            isPlaying: wavesurferRef.current.isPlaying?.() || 'unknown',
            duration: wavesurferRef.current.getDuration?.() || 'unknown',
            currentTime: wavesurferRef.current.getCurrentTime?.() || 'unknown',
         })

         if (isPlaying) {
            console.log('Attempting to pause playback...')
            wavesurferRef.current.pause()
            console.log('Pause command sent')
         } else {
            console.log('Attempting to start playback...')
            wavesurferRef.current.play()
            console.log('Play command sent')
         }
      } catch (error) {
         console.error('Toggle play/pause error:', error)
         console.log('Attempting to reinitialize WaveSurfer due to play/pause error')
         initializeWaveSurfer().catch(initError => {
            console.error('Reinitialize failed:', initError)
         })
      }
   }, [isPlaying, isLoading, currentTime, duration, initializeWaveSurfer, audioData, isInitialized])

   /**
    * 秒数をMM:SS形式でフォーマット
    */
   const formatTime = useCallback((time: number): string => {
      const SECONDS_IN_MINUTE = 60
      const minutes = Math.floor(time / SECONDS_IN_MINUTE)
      const seconds = Math.round(time % SECONDS_IN_MINUTE)
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
   }, [])

   // 音声データが変更されたときにWaveSurferを再初期化
   useEffect(() => {
      let isCancelled = false
      const safeInitialize = async () => {
         await initializeWaveSurfer()
         if (isCancelled) return
      }
      if (audioData) {
         safeInitialize()
      }
      return () => {
         isCancelled = true
         initIdRef.current++
         wavesurferRef.current?.unAll?.()
         wavesurferRef.current?.destroy()
         destroyWaveSurfer().catch(error => {
            // eslint-disable-next-line no-console
            console.warn('WaveSurfer cleanup error:', error)
         })
      }
   }, [audioData, initializeWaveSurfer, destroyWaveSurfer])

   // コンポーネントのアンマウント時にクリーンアップ
   useEffect(() => {
      return () => {
         destroyWaveSurfer().catch(error => {
            console.warn('WaveSurfer unmount cleanup error:', error)
         })
      }
   }, [destroyWaveSurfer])

   if (!audioData) {
      return (
         <div
            className={`flex items-center justify-center h-32 bg-gray-100 rounded-lg ${className}`}>
            <p className='text-gray-500'>音声データがありません</p>
         </div>
      )
   }

   if (error) {
      return (
         <div className={`flex items-center justify-center h-32 bg-red-50 rounded-lg ${className}`}>
            <p className='text-red-600'>エラー: {error.message}</p>
         </div>
      )
   }

   return (
      <div className={`w-full ${className}`}>
         {/* 波形表示エリア */}
         <div
            className='relative w-full bg-gray-50 rounded-lg overflow-hidden'
            style={{ height: `${height}px` }}>
            {/* WaveSurfer コンテナ */}
            <div ref={containerRef} className='absolute inset-0 w-full h-full' />
         </div>

         {/* コントロールパネル */}
         <div className='flex items-center justify-between mt-4 px-2'>
            <button
               type='button'
               onClick={togglePlayPause}
               disabled={isLoading || !isInitialized}
               className='flex items-center justify-center w-12 h-12 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-full transition-colors touch-manipulation'
               aria-label={isPlaying ? '一時停止' : '再生'}>
               {isLoading ? (
                  <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
               ) : isPlaying ? (
                  <MdPause className='w-6 h-6' />
               ) : (
                  <MdPlayArrow className='w-6 h-6' />
               )}
            </button>

            <div className='flex items-center gap-2 text-sm font-mono text-gray-600'>
               <span>{formatTime(currentTime)}</span>
               <span>/</span>
               <span>{formatTime(duration)}</span>
            </div>

            <div className='w-12' />
         </div>
      </div>
   )
}
