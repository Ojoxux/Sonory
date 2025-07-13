"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { MdPause, MdPlayArrow } from "react-icons/md"
import WaveSurfer from "wavesurfer.js"
import type { AudioData } from "../../../store/types"

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
   waveColor = "#1f2937",
   progressColor = "#dc2626",
   className = "",
   onReady,
   onFinish,
}: WaveformPlayerProps) {
   // DOM参照
   const containerRef = useRef<HTMLDivElement>(null)
   const wavesurferRef = useRef<WaveSurfer | null>(null)
   const isDestroyingRef = useRef<boolean>(false)
   const animationFrameRef = useRef<number | null>(null)
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
      return new Promise((resolve) => {
         if (!wavesurferRef.current || isDestroyingRef.current) {
            resolve()
            return
         }

         try {
            isDestroyingRef.current = true
            setIsInitialized(false)

            // アニメーションフレームをクリーンアップ
            if (animationFrameRef.current) {
               cancelAnimationFrame(animationFrameRef.current)
               animationFrameRef.current = null
            }

            if (
               wavesurferRef.current &&
               typeof wavesurferRef.current.destroy === "function"
            ) {
               try {
                  if (
                     wavesurferRef.current.isPlaying &&
                     typeof wavesurferRef.current.isPlaying === "function" &&
                     wavesurferRef.current.isPlaying()
                  ) {
                     wavesurferRef.current.pause()
                  }
               } catch (pauseError) {
                  console.warn("Error pausing before destroy:", pauseError)
               }

               // 即座に破棄せず、少し遅延させる
               setTimeout(() => {
                  try {
                     if (wavesurferRef.current) {
                        // すべてのイベントリスナーを先に解除
                        if (typeof wavesurferRef.current.unAll === "function") {
                           wavesurferRef.current.unAll()
                        }

                        // 破棄処理を実行
                        wavesurferRef.current.destroy()
                     }
                  } catch (error) {
                     console.warn("WaveSurfer destroy error:", error)
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
            console.warn("WaveSurfer destroy setup error:", error)
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

      if (
         typeof window === "undefined" ||
         !containerRef.current ||
         !audioData
      ) {
         return
      }

      // BlobやURLの有効性を事前にチェック
      if (!audioData.url && (!audioData.blob || audioData.blob.size === 0)) {
         setError(new Error("有効な音声データが見つかりません"))
         setIsLoading(false)
         return
      }

      try {
         setError(null)
         setIsLoading(true)
         setIsInitialized(false)

         // 既存のインスタンスを安全に破棄（Promiseの完了を必ず待つ）
         await destroyWaveSurfer()

         // ここで新しい初期化が走っていないかチェック
         if (myInitId !== initIdRef.current) return

         // コンテナが DOM に存在することを確認
         if (!containerRef.current.isConnected) {
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

         // durationを安全に設定するヘルパー関数
         const setDurationSafely = () => {
            const duration = wavesurfer.getDuration()
            if (Number.isFinite(duration) && duration > 0) {
               setDuration(duration)
               return true
            }
            return false
         }

         // イベントリスナーを設定
         wavesurfer.on("ready", () => {
            setIsLoading(false)
            setIsInitialized(true)

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

            onReady?.()
            wavesurfer.play() // 再生を ready イベント内で確実に実行
         })

         // 再生中の現在時刻を更新（requestAnimationFrameで滑らかに）
         const updateTime = () => {
            if (wavesurfer?.isPlaying?.()) {
               const time = wavesurfer.getCurrentTime()
               if (Number.isFinite(time) && time >= 0) {
                  setCurrentTime(time)
               }

               // 終了間近になったら手動で終了処理をトリガーする
               const audioDuration = wavesurfer.getDuration()
               if (
                  Number.isFinite(audioDuration) &&
                  audioDuration > 0 &&
                  Number.isFinite(time) &&
                  time >= audioDuration - 0.05
               ) {
                  // すでに再生が停止していなければ、手動で停止し、終了処理を呼び出す
                  if (wavesurfer.isPlaying()) {
                     wavesurfer.pause() // 再生を停止
                     setIsPlaying(false)
                     wavesurfer.seekTo(0) // 再生位置を先頭に
                     setCurrentTime(0) // UI上の時間もリセット
                     onFinish?.() // 親コンポーネントに終了を通知
                  }
               } else {
                  animationFrameRef.current = requestAnimationFrame(updateTime)
               }
            }
         }

         wavesurfer.on("audioprocess", (time: number) => {
            // 時間が有効な値かチェック
            if (Number.isFinite(time) && time >= 0) {
               setCurrentTime(time)
            }
            // 終了間近になったら手動で終了処理をトリガーする
            const audioDuration = wavesurfer.getDuration()
            if (
               Number.isFinite(audioDuration) &&
               audioDuration > 0 &&
               Number.isFinite(time) &&
               time >= audioDuration - 0.05
            ) {
               // すでに再生が停止していなければ、手動で停止し、終了処理を呼び出す
               if (wavesurfer.isPlaying()) {
                  wavesurfer.pause() // 再生を停止
                  setIsPlaying(false)
                  wavesurfer.seekTo(0) // 再生位置を先頭に
                  setCurrentTime(0) // UI上の時間もリセット
                  onFinish?.() // 親コンポーネントに終了を通知
               }
            }
         })

         // 再生位置が変化したときの現在時刻を更新
         wavesurfer.on("timeupdate", (time: number) => {
            // 時間が有効な値かチェック
            if (Number.isFinite(time) && time >= 0) {
               setCurrentTime(time)
            }
         })

         // 再生・一時停止状態の管理
         wavesurfer.on("play", () => {
            setIsPlaying(true)
            // 再生開始時にアニメーションフレーム更新を開始
            if (animationFrameRef.current) {
               cancelAnimationFrame(animationFrameRef.current)
            }
            animationFrameRef.current = requestAnimationFrame(updateTime)
         })

         wavesurfer.on("pause", () => {
            setIsPlaying(false)
            // 一時停止時にアニメーションフレーム更新を停止
            if (animationFrameRef.current) {
               cancelAnimationFrame(animationFrameRef.current)
               animationFrameRef.current = null
            }
         })

         // シーク時の再生位置更新
         wavesurfer.on("seeking", (time: number) => {
            // 時間が有効な値かチェック
            if (Number.isFinite(time) && time >= 0) {
               setCurrentTime(time)
            }
         })

         // エラー時の状態管理
         wavesurfer.on("error", (err: Error) => {
            console.error("WaveSurfer error event:", err)
            setError(err)
            setIsLoading(false)
            setIsPlaying(false)
            setIsInitialized(false)
         })

         // 音声データを読み込み
         try {
            if (audioData.url) {
               wavesurfer.load(audioData.url)
            } else if (audioData.blob) {
               wavesurfer.loadBlob(audioData.blob)
            } else {
               console.error("No valid audio data found")
               setError(new Error("有効な音声データが見つかりません"))
               setIsLoading(false)
               return
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
      audioData,
      height,
      waveColor,
      progressColor,
      onReady,
      onFinish,
      destroyWaveSurfer,
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

   /**
    * 秒数をMM:SS形式でフォーマット
    * NaNやInfinityを安全に処理
    */
   const formatTime = useCallback((time: number): string => {
      // NaN、Infinity、負の値をチェック
      if (!Number.isFinite(time) || time < 0) {
         return "00:00"
      }

      const minutes = Math.floor(time / SECONDS_IN_MINUTE)
      const seconds = Math.round(time % SECONDS_IN_MINUTE)
      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
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
         if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
         }
         wavesurferRef.current?.unAll?.()
         wavesurferRef.current?.destroy()
         destroyWaveSurfer().catch((error) => {
            // eslint-disable-next-line no-console
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

   if (!audioData) {
      return (
         <div
            className={`flex h-32 items-center justify-center rounded-lg bg-gray-100 ${className}`}
         >
            <p className="text-gray-500">音声データがありません</p>
         </div>
      )
   }

   if (error) {
      return (
         <div
            className={`flex h-32 items-center justify-center rounded-lg bg-red-50 ${className}`}
         >
            <p className="text-red-600">エラー: {error.message}</p>
         </div>
      )
   }

   return (
      <div className={`w-full ${className}`}>
         {/* 波形表示エリア */}
         <div
            className="relative w-full overflow-hidden rounded-lg bg-gray-50"
            style={{ height: `${height}px` }}
         >
            {/* WaveSurfer コンテナ */}
            <div
               ref={containerRef}
               className="absolute inset-0 h-full w-full"
               style={{
                  // WaveSurferの進捗バーを滑らかに
                  transition: isPlaying ? "none" : "all 0.2s ease-out",
               }}
            />
         </div>

         {/* コントロールパネル */}
         <div className="mt-4 flex items-center justify-between px-2">
            <button
               type="button"
               onClick={togglePlayPause}
               disabled={isLoading || !isInitialized}
               className="flex h-12 w-12 touch-manipulation items-center justify-center rounded-full bg-gray-900 text-white transition-colors hover:bg-gray-800 disabled:bg-gray-400"
               aria-label={isPlaying ? "一時停止" : "再生"}
            >
               {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
               ) : isPlaying ? (
                  <MdPause className="h-6 w-6" />
               ) : (
                  <MdPlayArrow className="h-6 w-6" />
               )}
            </button>

            <div className="flex items-center gap-2 font-mono text-gray-600 text-sm">
               <span>
                  {formatTime(Number.isFinite(currentTime) ? currentTime : 0)}
               </span>
               <span>/</span>
               <span>
                  {formatTime(Number.isFinite(duration) ? duration : 0)}
               </span>
            </div>

            <div className="w-12" />
         </div>
      </div>
   )
}
