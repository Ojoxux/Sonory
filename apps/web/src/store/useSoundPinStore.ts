import type { MapBounds } from "@sonory/shared-types"
import { create } from "zustand"
import type { AudioData, InferenceResult } from "./types"

// shared-types からの再エクスポート（既存の利用箇所との互換性維持）
export type { MapBounds }

/**
 * 位置情報の型定義（フロントエンド固有：latitude/longitude形式）
 */
export interface LocationData {
   latitude: number
   longitude: number
   accuracy?: number
}

/**
 * ピン作成状態の型定義
 */
export type PinCreationStatus = "idle" | "creating" | "success" | "error"

/**
 * 音声ピンデータの型定義
 */
export type SoundPin = {
   /** ピンの一意識別子 */
   id: string
   /** 録音地点の緯度 */
   latitude: number
   /** 録音地点の経度 */
   longitude: number
   /** 音声データ */
   audioData: AudioData
   /** AI分類結果 */
   classificationResults: InferenceResult[]
   /** 録音日時 */
   recordedAt: Date
   /** 最も信頼度の高い分類ラベル */
   primaryLabel: string
   /** 最も信頼度の高い分類の信頼度 */
   primaryConfidence: number
   /** 永続化済みかどうか */
   isPersisted?: boolean
   /** 天気情報 */
   weather?: {
      temperature: number
      condition: string
      windSpeed?: number
      humidity?: number
   }
   /** 時間タグ */
   timeTag?: "朝" | "昼" | "夕" | "夜"
   /** 環境情報 */
   environment?: string
}

/**
 * 音声ピンストアの状態型定義
 */
export type SoundPinState = {
   /** ローカル保存されている音声ピンの配列 */
   pins: SoundPin[]
   /** DB保存済みピンの配列 */
   persistedPins: SoundPin[]
   /** 一時ピンの配列（新ピン作成中に表示） */
   tempPins: SoundPin[]
   /** 選択中のピンID */
   selectedPinId: string | null
   /** ピン作成状態 */
   pinCreationStatus: PinCreationStatus
   /** ピン作成エラー */
   pinCreationError: string | null
   /** 最後に作成されたピンID */
   lastCreatedPinId: string | null
   /** 周辺ピン読み込み状態 */
   isLoadingNearbyPins: boolean
   /** 周辺ピン読み込みエラー */
   nearbyPinsError: string | null
   /** ピンを追加 */
   addPin: (
      pin: Omit<
         SoundPin,
         "id" | "recordedAt" | "primaryLabel" | "primaryConfidence"
      >,
   ) => void
   /** ピンを削除 */
   removePin: (pinId: string) => void
   /** ピンを選択 */
   selectPin: (pinId: string | null) => void
   /** 全ピンをクリア */
   clearAllPins: () => void
   /** 指定位置周辺のピンを取得 */
   getPinsNearLocation: (
      latitude: number,
      longitude: number,
      radiusKm?: number,
   ) => SoundPin[]
   /** 永続化ピンを作成 */
   createPersistentPin: (
      audioUrl: string,
      location: LocationData,
      analysisResult: InferenceResult[],
      duration?: number,
   ) => Promise<SoundPin>
   /** ピン作成状態を設定 */
   setPinCreationStatus: (status: PinCreationStatus) => void
   /** ピン作成エラーを設定 */
   setPinCreationError: (error: string | null) => void
   /** ローカルピンと永続化ピンを統合 */
   mergeLocalAndPersistedPins: () => SoundPin[]
   /** 周辺ピンを読み込み */
   loadNearbyPins: (bounds: MapBounds) => Promise<SoundPin[]>
   /** ピン作成状態をクリア */
   clearPinCreationState: () => void
}

/**
 * 2点間の距離を計算（ハーバーサイン公式）
 *
 * @param lat1 - 地点1の緯度
 * @param lon1 - 地点1の経度
 * @param lat2 - 地点2の緯度
 * @param lon2 - 地点2の経度
 * @returns 距離（キロメートル）
 */
function calculateDistance(
   lat1: number,
   lon1: number,
   lat2: number,
   lon2: number,
): number {
   const R = 6371 // 地球の半径（km）
   const dLat = ((lat2 - lat1) * Math.PI) / 180
   const dLon = ((lon2 - lon1) * Math.PI) / 180
   const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
         Math.cos((lat2 * Math.PI) / 180) *
         Math.sin(dLon / 2) *
         Math.sin(dLon / 2)
   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
   return R * c
}

/**
 * 天気情報を取得する関数
 */
async function fetchWeatherData(
   lat: number,
   lng: number,
): Promise<
   | {
        temperature: number
        condition: string
        windSpeed?: number
        humidity?: number
     }
   | undefined
> {
   try {
      const response = await fetch(
         `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&timezone=auto`,
      )

      if (!response.ok) {
         throw new Error(`天気情報の取得に失敗: ${response.status}`)
      }

      const data = await response.json()

      if (data.current_weather) {
         return {
            temperature: data.current_weather.temperature,
            condition: getWeatherCondition(data.current_weather.weathercode),
            windSpeed: data.current_weather.windspeed,
            humidity: data.current_weather.humidity || null,
         }
      }

      return undefined
   } catch (error) {
      console.warn("天気情報の取得に失敗:", error)
      return undefined
   }
}

/**
 * 天気コードから天気状態を取得
 */
function getWeatherCondition(weatherCode: number): string {
   const weatherConditions: Record<number, string> = {
      0: "晴れ",
      1: "ほぼ晴れ",
      2: "部分的に曇り",
      3: "曇り",
      45: "霧",
      48: "霧氷",
      51: "小雨",
      53: "雨",
      55: "大雨",
      61: "小雨",
      63: "雨",
      65: "大雨",
      71: "小雪",
      73: "雪",
      75: "大雪",
      95: "雷雨",
   }

   return weatherConditions[weatherCode] || "不明"
}

/**
 * 時間帯タグを生成
 */
function generateTimeTag(date: Date): "朝" | "昼" | "夕" | "夜" {
   const hour = date.getHours()

   if (hour >= 6 && hour < 12) return "朝"
   if (hour >= 12 && hour < 18) return "昼"
   if (hour >= 18 && hour < 21) return "夕"
   return "夜"
}

/**
 * APIレスポンスの型定義
 */
interface PinApiResponse {
   success: boolean
   data?: {
      id: string
      audio_url: string
      location: {
         lat: number
         lng: number
      }
      audio: {
         url: string
      }
      createdAt: string
      timeTag?: "朝" | "昼" | "夕" | "夜"
      weather?: {
         temperature: number
         condition: string
         windSpeed?: number
         humidity?: number
      }
   }
   error?: string
}

/**
 * 一時ピンを作成
 */
function createTempPin(
   audioUrl: string,
   location: LocationData,
   analysisResult: InferenceResult[],
   primaryResult: InferenceResult | undefined,
   timeTag: "朝" | "昼" | "夕" | "夜",
   weatherData:
      | {
           temperature: number
           condition: string
           windSpeed?: number
           humidity?: number
        }
      | undefined,
   duration: number | undefined,
   now: Date,
): SoundPin {
   return {
      id: crypto.randomUUID(),
      latitude: location.latitude,
      longitude: location.longitude,
      audioData: {
         blob: new Blob(),
         url: audioUrl,
         recordedAt: now,
         id: crypto.randomUUID(),
         duration: duration,
      },
      classificationResults: analysisResult,
      recordedAt: now,
      primaryLabel: primaryResult?.label ?? "不明",
      primaryConfidence: primaryResult?.confidence ?? 0,
      isPersisted: false,
      timeTag: timeTag,
      environment: primaryResult?.label || "unknown",
      weather: weatherData,
   }
}

/**
 * APIレスポンスをSoundPinに変換
 */
function convertApiResponseToPin(
   result: PinApiResponse,
   analysisResult: InferenceResult[],
   primaryResult: InferenceResult | undefined,
   duration: number | undefined,
): SoundPin {
   if (!result.success || !result.data) {
      throw new Error("ピン作成結果が不正です")
   }

   return {
      id: result.data.id,
      latitude: result.data.location.lat,
      longitude: result.data.location.lng,
      audioData: {
         blob: new Blob(),
         url: result.data.audio.url,
         recordedAt: new Date(result.data.createdAt),
         id: result.data.id,
         duration: duration,
      },
      classificationResults: analysisResult,
      recordedAt: new Date(result.data.createdAt),
      primaryLabel: primaryResult?.label ?? "不明",
      primaryConfidence: primaryResult?.confidence ?? 0,
      isPersisted: true,
      timeTag: result.data.timeTag,
      environment: primaryResult?.label || "unknown",
      weather: result.data.weather,
   }
}

/**
 * storage:// URLからピンを作成
 */
async function createPinFromStorageUrl(
   audioUrl: string,
   location: LocationData,
   analysisResult: InferenceResult[],
   primaryResult: InferenceResult | undefined,
   timeTag: "朝" | "昼" | "夕" | "夜",
   weatherData:
      | {
           temperature: number
           condition: string
           windSpeed?: number
           humidity?: number
        }
      | undefined,
   duration: number | undefined,
): Promise<SoundPin> {
   console.log("🔄 既にアップロード済みのため、メタデータのみでピン作成")

   const match = audioUrl.match(/^storage:\/\/[^/]+\/(.+)$/)
   const filePath = match?.[1]

   if (!filePath) {
      throw new Error("storage:// URLからファイルパスを抽出できませんでした")
   }

   const response = await fetch("/api/pins", {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({
         audio_file_path: filePath,
         location: {
            lat: location.latitude,
            lng: location.longitude,
            accuracy: location.accuracy,
         },
         metadata: {
            duration: duration || 10,
            timeTag,
            title: primaryResult?.label || "音声ピン",
            deviceInfo: navigator.userAgent,
            ...(weatherData ? { weather: weatherData } : {}),
         },
      }),
   })

   if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `ピン作成失敗: ${response.status}`)
   }

   const result: PinApiResponse = await response.json()
   return convertApiResponseToPin(
      result,
      analysisResult,
      primaryResult,
      duration,
   )
}

/**
 * 音声ファイルをアップロードしてピンを作成
 */
async function uploadPinWithAudio(
   audioUrl: string,
   location: LocationData,
   analysisResult: InferenceResult[],
   primaryResult: InferenceResult | undefined,
   timeTag: "朝" | "昼" | "夕" | "夜",
   weatherData:
      | {
           temperature: number
           condition: string
           windSpeed?: number
           humidity?: number
        }
      | undefined,
   duration: number | undefined,
): Promise<SoundPin> {
   console.log("🔄 音声ファイルをアップロード")

   const audioBlob = await fetch(audioUrl).then((res) => res.blob())

   const formData = new FormData()
   formData.append("audio", audioBlob, "audio.webm")
   formData.append(
      "location",
      JSON.stringify({
         lat: location.latitude,
         lng: location.longitude,
         accuracy: location.accuracy,
      }),
   )
   formData.append(
      "metadata",
      JSON.stringify({
         duration: duration || 10,
         timeTag,
         title: primaryResult?.label || "音声ピン",
         deviceInfo: navigator.userAgent,
         ...(weatherData ? { weather: weatherData } : {}),
      }),
   )

   const response = await fetch("/api/pins/upload", {
      method: "POST",
      body: formData,
   })

   if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `ピン作成失敗: ${response.status}`)
   }

   const result: PinApiResponse = await response.json()
   return convertApiResponseToPin(
      result,
      analysisResult,
      primaryResult,
      duration,
   )
}

/**
 * ピンの状態を更新（一時ピンを削除し、永続化ピンを追加）
 */
function updatePinState(tempPin: SoundPin, createdPin: SoundPin): void {
   useSoundPinStore.setState((state) => ({
      tempPins: state.tempPins.filter((p) => p.id !== tempPin.id),
      persistedPins: [...state.persistedPins, createdPin],
      pinCreationStatus: "success",
      lastCreatedPinId: createdPin.id,
   }))

   console.log("📍 ピン作成完了:", {
      pinId: createdPin.id,
      location: {
         lat: createdPin.latitude,
         lng: createdPin.longitude,
      },
      isPersisted: createdPin.isPersisted,
      weather: createdPin.weather,
   })
}

/**
 * 周辺ピン検索の遅延更新をスケジュール
 */
function scheduleNearbyPinsUpdate(pinId: string): void {
   console.log("⏰ 新ピン作成後の周辺ピン検索を1秒遅延...")
   setTimeout(() => {
      console.log("🔄 遅延後の周辺ピン検索実行")
      useSoundPinStore.setState((state) => ({
         ...state,
         lastCreatedPinId: pinId,
      }))
   }, 1000)
}

/**
 * DBピンの型定義
 */
interface DbPin {
   id: string
   location: { lat: number; lng: number }
   audio: { url: string; duration: number; format: string }
   title?: string
   timeTag?: "朝" | "昼" | "夕" | "夜"
   weather?: {
      temperature: number
      condition: string
      windSpeed?: number
      humidity?: number
   }
   aiAnalysis?: {
      transcription: string
      categories: {
         confidence: number
         topic: string
         emotion: string
         language: string
      }
      summary?: string
   }
   status: "active" | "processing" | "deleted" | "reported"
   createdAt: string
}

/**
 * 分類結果を構築
 */
function buildClassificationResults(pin: DbPin): InferenceResult[] {
   const results: InferenceResult[] = []

   // titleフィールドから分類結果を取得（最優先）
   if (pin.title && pin.title !== "音声ピン" && pin.title.trim() !== "") {
      results.push({
         label: pin.title,
         confidence: pin.aiAnalysis?.categories?.confidence || 0.8,
      })
      return results
   }

   // aiAnalysisのtopicから分類結果を取得
   if (
      pin.aiAnalysis?.categories?.topic &&
      pin.aiAnalysis.categories.topic !== "unknown"
   ) {
      results.push({
         label: pin.aiAnalysis.categories.topic,
         confidence: pin.aiAnalysis.categories.confidence || 0,
      })
      return results
   }

   // どちらもない場合は「未分類」
   results.push({
      label: "未分類",
      confidence: 0,
   })
   return results
}

/**
 * DBピンをSoundPinに変換
 */
function convertDbPinToSoundPin(dbPin: unknown): SoundPin {
   const pin = dbPin as DbPin

   // デバッグ: データベースから取得したピンデータの内容をログ出力
   if (process.env.NODE_ENV === "development") {
      console.log("🔍 Converting DB pin to SoundPin:", {
         pinId: pin.id,
         dbTitle: pin.title,
         aiAnalysis: pin.aiAnalysis,
         primaryResult: pin.aiAnalysis?.categories,
      })
   }

   const classificationResults = buildClassificationResults(pin)
   const primaryLabel =
      pin.title || pin.aiAnalysis?.categories?.topic || "音声ピン"
   const environment =
      pin.title || pin.aiAnalysis?.categories?.topic || "unknown"

   return {
      id: pin.id,
      latitude: pin.location.lat,
      longitude: pin.location.lng,
      audioData: {
         blob: new Blob(),
         url: pin.audio.url,
         recordedAt: new Date(pin.createdAt),
         id: pin.id,
      },
      classificationResults,
      recordedAt: new Date(pin.createdAt),
      primaryLabel,
      primaryConfidence: pin.aiAnalysis?.categories?.confidence || 0.8,
      isPersisted: true,
      weather: pin.weather,
      timeTag: pin.timeTag,
      environment,
   }
}

/**
 * 音声ピン管理用Zustandストア
 *
 * @description
 * 録音地点と分類結果を組み合わせた音声ピンの状態を管理します。
 * マップ上での表示と選択状態を制御します。
 * Phase 5Bでは永続化ピンの管理機能を追加しています。
 */
export const useSoundPinStore = create<SoundPinState>((set, get) => ({
   pins: [],
   persistedPins: [],
   tempPins: [],
   selectedPinId: null,
   pinCreationStatus: "idle",
   pinCreationError: null,
   lastCreatedPinId: null,
   isLoadingNearbyPins: false,
   nearbyPinsError: null,

   /**
    * 新しい音声ピンを追加します
    *
    * @param pin - 追加するピンデータ（id、recordedAt、primaryLabel、primaryConfidenceは自動生成）
    */
   addPin: (pin): void => {
      const primaryResult = pin.classificationResults[0]
      const newPin: SoundPin = {
         ...pin,
         id: crypto.randomUUID(),
         recordedAt: new Date(),
         primaryLabel: primaryResult?.label ?? "不明",
         primaryConfidence: primaryResult?.confidence ?? 0,
         isPersisted: false,
      }

      set((state) => ({
         pins: [...state.pins, newPin],
      }))
   },

   /**
    * 指定されたIDのピンを削除します
    *
    * @param pinId - 削除するピンのID
    */
   removePin: (pinId): void => {
      set((state) => ({
         pins: state.pins.filter((pin) => pin.id !== pinId),
         persistedPins: state.persistedPins.filter((pin) => pin.id !== pinId),
         selectedPinId:
            state.selectedPinId === pinId ? null : state.selectedPinId,
      }))
   },

   /**
    * ピンを選択します
    *
    * @param pinId - 選択するピンのID（nullで選択解除）
    */
   selectPin: (pinId): void => {
      set({ selectedPinId: pinId })
   },

   /**
    * 全ての音声ピンをクリアします
    */
   clearAllPins: (): void => {
      set({ pins: [], persistedPins: [], selectedPinId: null })
   },

   /**
    * 指定位置周辺の音声ピンを取得します
    *
    * @param latitude - 中心地点の緯度
    * @param longitude - 中心地点の経度
    * @param radiusKm - 検索半径（キロメートル、デフォルト: 1km）
    * @returns 指定範囲内の音声ピン配列
    */
   getPinsNearLocation: (latitude, longitude, radiusKm = 1): SoundPin[] => {
      const { pins, persistedPins } = get()
      const allPins = [...pins, ...persistedPins]

      return allPins.filter((pin) => {
         const distance = calculateDistance(
            latitude,
            longitude,
            pin.latitude,
            pin.longitude,
         )
         return distance <= radiusKm
      })
   },

   /**
    * 永続化ピンを作成します
    *
    * @param audioUrl - 音声ファイルのURL
    * @param location - 位置情報
    * @param analysisResult - AI分析結果
    * @returns 作成されたピン
    */
   createPersistentPin: async (
      audioUrl: string,
      location: LocationData,
      analysisResult: InferenceResult[],
      duration?: number,
   ): Promise<SoundPin> => {
      try {
         set({
            pinCreationStatus: "creating",
            pinCreationError: null,
         })

         const now = new Date()
         const timeTag = generateTimeTag(now)
         const primaryResult = analysisResult[0]

         // 天気情報を取得
         const weatherData = await fetchWeatherData(
            location.latitude,
            location.longitude,
         )

         // 一時ピンを作成して追加
         const tempPin = createTempPin(
            audioUrl,
            location,
            analysisResult,
            primaryResult,
            timeTag,
            weatherData,
            duration,
            now,
         )

         set((state) => ({
            tempPins: [...state.tempPins, tempPin],
            lastCreatedPinId: tempPin.id,
         }))

         // storage:// URLの場合
         if (audioUrl.startsWith("storage://")) {
            const createdPin = await createPinFromStorageUrl(
               audioUrl,
               location,
               analysisResult,
               primaryResult,
               timeTag,
               weatherData,
               duration,
            )
            updatePinState(tempPin, createdPin)
            scheduleNearbyPinsUpdate(createdPin.id)
            return createdPin
         }

         // blob: URLの場合
         const createdPin = await uploadPinWithAudio(
            audioUrl,
            location,
            analysisResult,
            primaryResult,
            timeTag,
            weatherData,
            duration,
         )
         updatePinState(tempPin, createdPin)
         scheduleNearbyPinsUpdate(createdPin.id)
         return createdPin
      } catch (error) {
         const errorMessage =
            error instanceof Error ? error.message : "ピン作成に失敗しました"

         set((_state) => ({
            tempPins: [],
            pinCreationStatus: "error",
            pinCreationError: errorMessage,
         }))

         throw error
      }
   },

   /**
    * ピン作成状態を設定します
    *
    * @param status - 設定する状態
    */
   setPinCreationStatus: (status): void => {
      set({ pinCreationStatus: status })
   },

   /**
    * ピン作成エラーを設定します
    *
    * @param error - エラーメッセージ
    */
   setPinCreationError: (error): void => {
      set({ pinCreationError: error })
   },

   /**
    * ローカルピンと永続化ピンを統合します
    *
    * @returns 統合されたピン配列
    */
   mergeLocalAndPersistedPins: (): SoundPin[] => {
      const { pins, persistedPins, tempPins } = get()
      const allPins = [...pins, ...persistedPins, ...tempPins]

      console.log("🔄 ピン統合処理:", {
         localPins: pins.length,
         persistedPins: persistedPins.length,
         tempPins: tempPins.length,
         totalPins: allPins.length,
         localPinsData: pins.map((p) => ({
            id: p.id,
            isPersisted: p.isPersisted,
            lat: p.latitude,
            lng: p.longitude,
            recordedAt: p.recordedAt,
         })),
         persistedPinsData: persistedPins.map((p) => ({
            id: p.id,
            isPersisted: p.isPersisted,
            lat: p.latitude,
            lng: p.longitude,
            recordedAt: p.recordedAt,
         })),
         tempPinsData: tempPins.map((p) => ({
            id: p.id,
            isPersisted: p.isPersisted,
            lat: p.latitude,
            lng: p.longitude,
            recordedAt: p.recordedAt,
         })),
         allPinsData: allPins.map((p, index) => ({
            index,
            id: p.id,
            isPersisted: p.isPersisted,
            lat: p.latitude,
            lng: p.longitude,
            recordedAt: p.recordedAt,
         })),
      })

      // 重複排除（IDベースの重複のみ除外）
      const uniquePins = allPins.filter((pin, index, array) => {
         const isDuplicate = array.findIndex((p) => p.id === pin.id) === index

         if (!isDuplicate) {
            console.log("🔄 重複ピンを除外（ID重複）:", {
               duplicatePin: {
                  id: pin.id,
                  lat: pin.latitude,
                  lng: pin.longitude,
                  isPersisted: pin.isPersisted,
               },
               index: index,
            })
         }

         return isDuplicate
      })

      // 表示優先度でソート（新しいピン > 分析済みピン > ローカルピン）
      const sortedPins = uniquePins.sort((a, b) => {
         // 永続化済みピンを優先
         if (a.isPersisted && !b.isPersisted) return -1
         if (!a.isPersisted && b.isPersisted) return 1

         // 新しいピンを優先
         return b.recordedAt.getTime() - a.recordedAt.getTime()
      })

      console.log("✅ ピン統合完了:", {
         uniquePins: uniquePins.length,
         sortedPins: sortedPins.length,
         finalPins: sortedPins.map((p) => ({
            id: p.id,
            isPersisted: p.isPersisted,
            lat: p.latitude,
            lng: p.longitude,
         })),
      })

      return sortedPins
   },

   /**
    * 周辺ピンを読み込みます
    *
    * @param bounds - 地図境界
    * @returns 読み込まれたピン配列
    */
   loadNearbyPins: async (bounds: MapBounds): Promise<SoundPin[]> => {
      try {
         set({
            isLoadingNearbyPins: true,
            nearbyPinsError: null,
         })

         const params = new URLSearchParams({
            north: bounds.north.toString(),
            south: bounds.south.toString(),
            east: bounds.east.toString(),
            west: bounds.west.toString(),
            limit: "50",
         })

         console.log("🔍 周辺ピン検索開始:", {
            bounds,
            queryParams: Object.fromEntries(params.entries()),
            url: `/api/pins/nearby?${params}`,
         })

         const response = await fetch(`/api/pins/nearby?${params}`)

         console.log("📡 周辺ピン検索レスポンス:", {
            status: response.status,
            ok: response.ok,
         })

         if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error("❌ 周辺ピン取得エラー:", {
               status: response.status,
               errorData,
            })
            throw new Error(
               errorData.message || `ピン取得失敗: ${response.status}`,
            )
         }

         const result = await response.json()

         console.log("📋 周辺ピン検索結果:", {
            success: result.success,
            dataType: typeof result.data,
            dataLength: Array.isArray(result.data)
               ? result.data.length
               : "not array",
            data: result.data,
         })

         if (!result.success || !result.data) {
            throw new Error("ピン取得結果が不正です")
         }

         // DB結果をSoundPin形式に変換
         const loadedPins: SoundPin[] = (result.data || []).map(
            (dbPin: unknown) => convertDbPinToSoundPin(dbPin),
         )

         set((_state) => ({
            persistedPins: loadedPins,
            isLoadingNearbyPins: false,
            nearbyPinsError: null,
         }))

         console.log("🗺️ 周辺ピン読み込み完了:", {
            bounds,
            loadedCount: loadedPins.length,
            pins: loadedPins.map((p) => ({
               id: p.id,
               lat: p.latitude,
               lng: p.longitude,
               isPersisted: p.isPersisted,
            })),
         })

         return loadedPins
      } catch (error) {
         const errorMessage =
            error instanceof Error ? error.message : "ピン取得に失敗しました"

         set({
            isLoadingNearbyPins: false,
            nearbyPinsError: errorMessage,
         })

         throw error
      }
   },

   /**
    * ピン作成状態をクリアします
    */
   clearPinCreationState: (): void => {
      set({
         pinCreationStatus: "idle",
         pinCreationError: null,
         lastCreatedPinId: null,
      })
   },
}))
