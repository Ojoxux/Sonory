import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react"
import WaveSurfer from "wavesurfer.js"
import type { AudioData } from "../../../store/types"

/**
 * useWaveformPlayerのパラメータ型
 */
export type UseWaveformPlayerParams = {
   /** 再生する音声データ */
   audioData: AudioData | null
   /** 波形の高さ（ピクセル） */
   height: number
   /** 波形の色 */
   waveColor: string
   /** 再生プログレスの色 */
   progressColor: string
   /** 初期化完了時のコールバック */
   onReady?: () => void
   /** 再生完了時のコールバック */
   onFinish?: () => void
}

/**
 * useWaveformPlayerの戻り値型
 */
export type UseWaveformPlayerReturn = {
   /** WaveSurferコンテナのref */
   containerRef: React.RefObject<HTMLDivElement | null>
   /** 再生中かどうか */
   isPlaying: boolean
   /** 読み込み中かどうか */
   isLoading: boolean
   /** 初期化済みかどうか */
   isInitialized: boolean
   /** 現在の再生時間（秒） */
   currentTime: number
   /** 総再生時間（秒） */
   duration: number
   /** エラー状態 */
   error: Error | null
   /** 再生/一時停止を切り替える */
   togglePlayPause: () => void
}

/**
 * WaveSurferを使用した音声再生ロジックを管理するカスタムフック
 * @param params UseWaveformPlayerParams
 * @returns UseWaveformPlayerReturn
 */
export function useWaveformPlayer({
   audioData,
   height,
   waveColor,
   progressColor,
   onReady,
   onFinish,
}: UseWaveformPlayerParams): UseWaveformPlayerReturn {
   // DOM参照
   const containerRef = useRef<HTMLDivElement>(null)
   const wavesurferRef = useRef<WaveSurfer | null>(null)
   const isDestroyingRef = useRef<boolean>(false)
   const animationFrameRef = useRef<number | null>(null)
   const initIdRef = useRef<number>(0)

   // 状態管理
   const [isPlaying, setIsPlaying] = useState<boolean>(false)
   const [isLoading, setIsLoading] = useState<boolean>(false)
   const [duration, setDuration] = useState<number>(0)
   const [currentTime, setCurrentTime] = useState<number>(0)
   const [error, setError] = useState<Error | null>(null)
   const [isInitialized, setIsInitialized] = useState<boolean>(false)

   /**
    * アニメーションフレームをクリーンアップする
    */
   const cleanupAnimationFrame = useCallback((): void => {
      if (animationFrameRef.current) {
         cancelAnimationFrame(animationFrameRef.current)
         animationFrameRef.current = null
      }
   }, [])

   /**
    * WaveSurferを停止する
    */
   const pauseWaveSurfer = useCallback((): void => {
      if (
         wavesurferRef.current?.isPlaying &&
         typeof wavesurferRef.current.isPlaying === "function" &&
         wavesurferRef.current.isPlaying()
      ) {
         try {
            wavesurferRef.current.pause()
         } catch (pauseError) {
            console.warn("Error pausing before destroy:", pauseError)
         }
      }
   }, [])

   /**
    * WaveSurferインスタンスを実際に破棄する
    */
   const performDestroy = useCallback((): void => {
      if (!wavesurferRef.current) {
         return
      }

      try {
         // すべてのイベントリスナーを先に解除
         if (typeof wavesurferRef.current.unAll === "function") {
            wavesurferRef.current.unAll()
         }

         // 破棄処理を実行
         wavesurferRef.current.destroy()
      } catch (error) {
         console.warn("WaveSurfer destroy error:", error)
      } finally {
         wavesurferRef.current = null
         isDestroyingRef.current = false
      }
   }, [])

   /**
    * WaveSurferインスタンスを安全に破棄
    */
   const destroyWaveSurfer = useCallback((): Promise<void> => {
      return new Promise((resolve) => {
         if (!wavesurferRef.current || isDestroyingRef.current) {
            resolve()
            return
         }

         try {
            isDestroyingRef.current = true
            setIsInitialized(false)

            // アニメーションフレームをクリーンアップ
            cleanupAnimationFrame()

            if (
               wavesurferRef.current &&
               typeof wavesurferRef.current.destroy === "function"
            ) {
               // 再生停止処理
               pauseWaveSurfer()

               // 即座に破棄せず、少し遅延させる
               setTimeout(() => {
                  performDestroy()
                  resolve()
               }, 200) // 遅延時間を増やす
            } else {
               wavesurferRef.current = null
               isDestroyingRef.current = false
               resolve()
            }
         } catch (error) {
            console.warn("WaveSurfer destroy setup error:", error)
            wavesurferRef.current = null
            isDestroyingRef.current = false
            resolve()
         }
      })
   }, [cleanupAnimationFrame, pauseWaveSurfer, performDestroy])

   /**
    * useEffectEventでコールバックをラップ
    */
   const onReadyEvent = useEffectEvent(() => {
      onReady?.()
   })

   const onFinishEvent = useEffectEvent(() => {
      onFinish?.()
   })

   /**
    * 初期状態を検証する
    */
   const validateInitialization = useCallback((): boolean => {
      if (
         typeof window === "undefined" ||
         !containerRef.current ||
         !audioData
      ) {
         return false
      }

      if (!audioData.blob || audioData.blob.size === 0) {
         setError(new Error("有効な音声データが見つかりません"))
         setIsLoading(false)
         return false
      }

      return true
   }, [audioData])

   /**
    * durationを安全に設定する（複数回リトライ）
    */
   const setupDurationTracking = useCallback((wavesurfer: WaveSurfer): void => {
      const setDurationSafely = (): boolean => {
         const duration = wavesurfer.getDuration()
         if (Number.isFinite(duration) && duration > 0) {
            setDuration(duration)
            return true
         }
         return false
      }

      // 即座にdurationを試行
      if (!setDurationSafely()) {
         // 少し遅延を入れてから再試行
         setTimeout(() => {
            if (!setDurationSafely()) {
               // さらに遅延して最終試行
               setTimeout(() => {
                  if (!setDurationSafely()) {
                     // 最終的にデフォルト値を設定
                     setDuration(10)
                     console.warn(
                        "WaveSurfer音声のdurationが取得できませんでした。デフォルト値を使用します。",
                     )
                  }
               }, 100)
            }
         }, 50)
      }
   }, [])

   /**
    * 再生終了処理
    */
   const handlePlaybackFinish = useCallback(
      (wavesurfer: WaveSurfer): void => {
         if (wavesurfer.isPlaying()) {
            wavesurfer.pause()
            setIsPlaying(false)
            wavesurfer.seekTo(0)
            setCurrentTime(0)
            onFinishEvent()
         }
      },
      [onFinishEvent],
   )

   /**
    * 現在時刻を更新する（再生終了チェック付き）
    */
   const updateCurrentTime = useCallback(
      (wavesurfer: WaveSurfer, time: number): void => {
         if (Number.isFinite(time) && time >= 0) {
            setCurrentTime(time)
         }

         const audioDuration = wavesurfer.getDuration()
         if (
            Number.isFinite(audioDuration) &&
            audioDuration > 0 &&
            Number.isFinite(time) &&
            time >= audioDuration - 0.05
         ) {
            handlePlaybackFinish(wavesurfer)
         }
      },
      [handlePlaybackFinish],
   )

   /**
    * イベントリスナーを設定する
    */
   const setupEventListeners = useCallback(
      (wavesurfer: WaveSurfer): void => {
         // readyイベント
         wavesurfer.on("ready", () => {
            setIsLoading(false)
            setIsInitialized(true)
            setupDurationTracking(wavesurfer)
            onReadyEvent()
            wavesurfer.play()
         })

         // 再生中の現在時刻更新（requestAnimationFrame）
         const updateTime = (): void => {
            if (wavesurfer?.isPlaying?.()) {
               const time = wavesurfer.getCurrentTime()
               updateCurrentTime(wavesurfer, time)

               if (!wavesurfer.isPlaying()) {
                  return
               }

               const audioDuration = wavesurfer.getDuration()
               const currentTime = wavesurfer.getCurrentTime()
               if (
                  !(
                     Number.isFinite(audioDuration) &&
                     audioDuration > 0 &&
                     Number.isFinite(currentTime) &&
                     currentTime >= audioDuration - 0.05
                  )
               ) {
                  animationFrameRef.current = requestAnimationFrame(updateTime)
               }
            }
         }

         // audioprocessイベント
         wavesurfer.on("audioprocess", (time: number) => {
            updateCurrentTime(wavesurfer, time)
         })

         // timeupdateイベント
         wavesurfer.on("timeupdate", (time: number) => {
            if (Number.isFinite(time) && time >= 0) {
               setCurrentTime(time)
            }
         })

         // playイベント
         wavesurfer.on("play", () => {
            setIsPlaying(true)
            if (animationFrameRef.current) {
               cancelAnimationFrame(animationFrameRef.current)
            }
            animationFrameRef.current = requestAnimationFrame(updateTime)
         })

         // pauseイベント
         wavesurfer.on("pause", () => {
            setIsPlaying(false)
            if (animationFrameRef.current) {
               cancelAnimationFrame(animationFrameRef.current)
               animationFrameRef.current = null
            }
         })

         // seekingイベント
         wavesurfer.on("seeking", (time: number) => {
            if (Number.isFinite(time) && time >= 0) {
               setCurrentTime(time)
            }
         })

         // errorイベント
         wavesurfer.on("error", (err: Error) => {
            console.error("WaveSurfer error event:", err)
            setError(err)
            setIsLoading(false)
            setIsPlaying(false)
            setIsInitialized(false)
         })
      },
      [setupDurationTracking, updateCurrentTime, onReadyEvent],
   )

   /**
    * 音声データを読み込む
    */
   const loadAudioData = useCallback(
      (wavesurfer: WaveSurfer): void => {
         if (!audioData) {
            console.error("No audio data provided")
            setError(new Error("音声データが提供されていません"))
            setIsLoading(false)
            return
         }

         try {
            if (audioData.blob) {
               wavesurfer.loadBlob(audioData.blob)
            } else if (audioData.url) {
               wavesurfer.load(audioData.url)
            } else {
               console.error("No valid audio data found")
               setError(new Error("有効な音声データが見つかりません"))
               setIsLoading(false)
            }
         } catch (loadError) {
            console.error("Audio loading error:", loadError)
            setError(
               loadError instanceof Error
                  ? loadError
                  : new Error("音声データの読み込みに失敗しました"),
            )
            setIsLoading(false)
         }
      },
      [audioData],
   )

   /**
    * WaveSurferインスタンスを初期化
    * - 既存インスタンスの破棄と競合防止
    * - 音声データの有効性チェック
    * - イベントリスナー登録
    */
   const initializeWaveSurfer = useCallback(async (): Promise<void> => {
      const myInitId = ++initIdRef.current

      if (!validateInitialization()) {
         return
      }

      try {
         setError(null)
         setIsLoading(true)
         setIsInitialized(false)

         // 既存のインスタンスを安全に破棄
         await destroyWaveSurfer()

         // ここで新しい初期化が走っていないかチェック
         if (myInitId !== initIdRef.current) return

         // コンテナが DOM に存在することを確認
         if (!containerRef.current?.isConnected) {
            console.warn("Container is not connected to DOM")
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
            backend: "WebAudio",
         })

         wavesurferRef.current = wavesurfer

         // イベントリスナーを設定
         setupEventListeners(wavesurfer)

         // 音声データを読み込み
         loadAudioData(wavesurfer)
      } catch (err) {
         console.error("WaveSurfer initialization error:", err)
         const error =
            err instanceof Error
               ? err
               : new Error("WaveSurferの初期化に失敗しました")
         setError(error)
         setIsLoading(false)
      }
   }, [
      validateInitialization,
      destroyWaveSurfer,
      height,
      waveColor,
      progressColor,
      setupEventListeners,
      loadAudioData,
   ])

   /**
    * 再生/一時停止を切り替え
    */
   const togglePlayPause = useCallback((): void => {
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
            "WaveSurfer instance not available or not initialized - attempting to reinitialize",
         )
         if (audioData) {
            initializeWaveSurfer().catch((error) => {
               console.error("Failed to reinitialize WaveSurfer:", error)
            })
         }
         return
      }

      try {
         if (isPlaying) {
            wavesurferRef.current.pause()
         } else {
            wavesurferRef.current.play()
         }
      } catch (error) {
         console.error("Toggle play/pause error:", error)
         initializeWaveSurfer().catch((initError) => {
            console.error("Reinitialize failed:", initError)
         })
      }
   }, [isPlaying, initializeWaveSurfer, audioData, isInitialized])

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
         if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
         }
         wavesurferRef.current?.unAll?.()
         wavesurferRef.current?.destroy()
         destroyWaveSurfer().catch((error) => {
            console.warn("WaveSurfer cleanup error:", error)
         })
      }
   }, [audioData, initializeWaveSurfer, destroyWaveSurfer])

   // コンポーネントのアンマウント時にクリーンアップ
   useEffect(() => {
      return () => {
         if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
         }
         destroyWaveSurfer().catch((error) => {
            console.warn("WaveSurfer unmount cleanup error:", error)
         })
      }
   }, [destroyWaveSurfer])

   return {
      containerRef,
      isPlaying,
      isLoading,
      isInitialized,
      currentTime,
      duration,
      error,
      togglePlayPause,
   }
}
