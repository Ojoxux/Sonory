import { create } from "zustand"
import type { AudioData, InferenceResult } from "./types"

/**
 * 位置情報の型定義
 */
export interface LocationData {
   latitude: number
   longitude: number
   accuracy?: number
}

/**
 * 地図境界の型定義
 */
export interface MapBounds {
   north: number
   south: number
   east: number
   west: number
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
 * 現在の時間から時間タグを生成
 *
 * @param date - 対象の日時
 * @returns 時間タグ
 */
function generateTimeTag(date: Date): "朝" | "昼" | "夕" | "夜" {
   const hour = date.getHours()
   if (hour >= 6 && hour < 12) return "朝"
   if (hour >= 12 && hour < 18) return "昼"
   if (hour >= 18 && hour < 24) return "夕"
   return "夜"
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
   ): Promise<SoundPin> => {
      try {
         set({
            pinCreationStatus: "creating",
            pinCreationError: null,
         })

         const now = new Date()
         const timeTag = generateTimeTag(now)
         const primaryResult = analysisResult[0]

         // バックエンドAPIに送信するデータを準備
         const pinData = {
            location: {
               lat: location.latitude,
               lng: location.longitude,
               accuracy: location.accuracy,
            },
            audio: {
               url: audioUrl,
               duration: 10, // 10秒固定
               format: "webm" as const,
            },
            timeTag,
            title: primaryResult?.label || "音声ピン",
            deviceInfo: navigator.userAgent,
         }

         // バックエンドAPIにピンを作成
         const response = await fetch("/api/pins", {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify(pinData),
         })

         if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(
               errorData.message || `ピン作成失敗: ${response.status}`,
            )
         }

         const result = await response.json()

         if (!result.success || !result.data) {
            throw new Error("ピン作成結果が不正です")
         }

         // 作成されたピンをローカル形式に変換
         const createdPin: SoundPin = {
            id: result.data.id,
            latitude: result.data.location.lat,
            longitude: result.data.location.lng,
            audioData: {
               blob: new Blob(), // 空のBlob（実際のBlobは不要）
               url: result.data.audio.url,
               recordedAt: new Date(result.data.createdAt),
               id: result.data.id,
            },
            classificationResults: analysisResult,
            recordedAt: new Date(result.data.createdAt),
            primaryLabel: primaryResult?.label ?? "不明",
            primaryConfidence: primaryResult?.confidence ?? 0,
            isPersisted: true,
            timeTag: result.data.timeTag,
            environment: primaryResult?.label || "unknown",
         }

         set((state) => ({
            persistedPins: [...state.persistedPins, createdPin],
            pinCreationStatus: "success",
            lastCreatedPinId: createdPin.id,
         }))

         return createdPin
      } catch (error) {
         const errorMessage =
            error instanceof Error ? error.message : "ピン作成に失敗しました"

         set({
            pinCreationStatus: "error",
            pinCreationError: errorMessage,
         })

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
      const { pins, persistedPins } = get()
      const allPins = [...pins, ...persistedPins]

      // 重複排除（同じ位置・時間のピンは統合）
      const uniquePins = allPins.filter((pin, index, array) => {
         return (
            array.findIndex((p) => {
               const isSameLocation =
                  Math.abs(p.latitude - pin.latitude) < 0.0001 &&
                  Math.abs(p.longitude - pin.longitude) < 0.0001
               const isSameTime =
                  Math.abs(p.recordedAt.getTime() - pin.recordedAt.getTime()) <
                  60000 // 1分以内
               return isSameLocation && isSameTime
            }) === index
         )
      })

      // 表示優先度でソート（新しいピン > 分析済みピン > ローカルピン）
      return uniquePins.sort((a, b) => {
         // 永続化済みピンを優先
         if (a.isPersisted && !b.isPersisted) return -1
         if (!a.isPersisted && b.isPersisted) return 1

         // 新しいピンを優先
         return b.recordedAt.getTime() - a.recordedAt.getTime()
      })
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

         const response = await fetch(`/api/pins/nearby?${params}`)

         if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(
               errorData.message || `ピン取得失敗: ${response.status}`,
            )
         }

         const result = await response.json()

         if (!result.success || !result.data) {
            throw new Error("ピン取得結果が不正です")
         }

         // DB結果をSoundPin形式に変換
         const loadedPins: SoundPin[] = (result.data.pins || []).map(
            (dbPin: unknown) => {
               const pin = dbPin as {
                  id: string
                  location: { lat: number; lng: number }
                  audio: { url: string; duration: number; format: string }
                  title?: string
                  timeTag?: string
                  weather?: unknown
                  aiAnalysis?: {
                     classifications?: unknown[]
                     categories?: { confidence?: number; topic?: string }
                  }
                  createdAt: string
               }

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
                  classificationResults: pin.aiAnalysis?.classifications || [],
                  recordedAt: new Date(pin.createdAt),
                  primaryLabel: pin.title || "音声ピン",
                  primaryConfidence:
                     pin.aiAnalysis?.categories?.confidence || 0,
                  isPersisted: true,
                  weather: pin.weather,
                  timeTag: pin.timeTag,
                  environment: pin.aiAnalysis?.categories?.topic || "unknown",
               }
            },
         )

         set((_state) => ({
            persistedPins: loadedPins,
            isLoadingNearbyPins: false,
         }))

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
