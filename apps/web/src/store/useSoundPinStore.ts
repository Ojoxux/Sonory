import type { MapBounds, WeatherData } from "@sonory/shared-types"
import { create } from "zustand"
import { calculateDistanceKm, generateTimeTag } from "../domain/geo"
import {
   convertApiResponseToPin,
   convertDbPinToSoundPin,
} from "../domain/pin-converter"
import {
   createPinFromStorageUrl,
   fetchNearbyPins,
   uploadPinWithAudio,
} from "../services/pin-api"
import { fetchWeatherData } from "../services/weather"
import type { AudioData, InferenceResult } from "./types"

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
   id: string
   latitude: number
   longitude: number
   audioData: AudioData
   classificationResults: InferenceResult[]
   recordedAt: Date
   primaryLabel: string
   primaryConfidence: number
   isPersisted?: boolean
   weather?: WeatherData
   timeTag?: "朝" | "昼" | "夕" | "夜"
   environment?: string
}

/**
 * 音声ピンストアの状態型定義
 */
export type SoundPinState = {
   pins: SoundPin[]
   persistedPins: SoundPin[]
   tempPins: SoundPin[]
   selectedPinId: string | null
   pinCreationStatus: PinCreationStatus
   pinCreationError: string | null
   lastCreatedPinId: string | null
   isLoadingNearbyPins: boolean
   nearbyPinsError: string | null
   addPin: (
      pin: Omit<
         SoundPin,
         "id" | "recordedAt" | "primaryLabel" | "primaryConfidence"
      >,
   ) => void
   removePin: (pinId: string) => void
   selectPin: (pinId: string | null) => void
   clearAllPins: () => void
   getPinsNearLocation: (
      latitude: number,
      longitude: number,
      radiusKm?: number,
   ) => SoundPin[]
   createPersistentPin: (
      audioUrl: string,
      location: LocationData,
      analysisResult: InferenceResult[],
      duration?: number,
   ) => Promise<SoundPin>
   setPinCreationStatus: (status: PinCreationStatus) => void
   setPinCreationError: (error: string | null) => void
   mergeLocalAndPersistedPins: () => SoundPin[]
   loadNearbyPins: (bounds: MapBounds) => Promise<SoundPin[]>
   clearPinCreationState: () => void
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
   weatherData: WeatherData | undefined,
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
         duration,
      },
      classificationResults: analysisResult,
      recordedAt: now,
      primaryLabel: primaryResult?.label ?? "不明",
      primaryConfidence: primaryResult?.confidence ?? 0,
      isPersisted: false,
      timeTag,
      environment: primaryResult?.label || "unknown",
      weather: weatherData,
   }
}

/**
 * 音声ピン管理用Zustandストア
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

   removePin: (pinId): void => {
      set((state) => ({
         pins: state.pins.filter((pin) => pin.id !== pinId),
         persistedPins: state.persistedPins.filter((pin) => pin.id !== pinId),
         selectedPinId:
            state.selectedPinId === pinId ? null : state.selectedPinId,
      }))
   },

   selectPin: (pinId): void => {
      set({ selectedPinId: pinId })
   },

   clearAllPins: (): void => {
      set({ pins: [], persistedPins: [], selectedPinId: null })
   },

   getPinsNearLocation: (latitude, longitude, radiusKm = 1): SoundPin[] => {
      const { pins, persistedPins } = get()
      return [...pins, ...persistedPins].filter(
         (pin) =>
            calculateDistanceKm(
               latitude,
               longitude,
               pin.latitude,
               pin.longitude,
            ) <= radiusKm,
      )
   },

   createPersistentPin: async (
      audioUrl: string,
      location: LocationData,
      analysisResult: InferenceResult[],
      duration?: number,
   ): Promise<SoundPin> => {
      try {
         set({ pinCreationStatus: "creating", pinCreationError: null })

         const now = new Date()
         const timeTag = generateTimeTag(now)
         const primaryResult = analysisResult[0]
         const weatherData = await fetchWeatherData(
            location.latitude,
            location.longitude,
         )

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

         const apiParams = {
            location: {
               lat: location.latitude,
               lng: location.longitude,
               accuracy: location.accuracy,
            },
            duration: duration || 10,
            timeTag,
            title: primaryResult?.label || "音声ピン",
            deviceInfo: navigator.userAgent,
            weather: weatherData,
         }

         let result
         if (audioUrl.startsWith("storage://")) {
            const match = audioUrl.match(/^storage:\/\/[^/]+\/(.+)$/)
            const filePath = match?.[1]
            if (!filePath) {
               throw new Error(
                  "storage:// URLからファイルパスを抽出できませんでした",
               )
            }
            result = await createPinFromStorageUrl({
               audioFilePath: filePath,
               ...apiParams,
            })
         } else {
            const audioBlob = await fetch(audioUrl).then((res) => res.blob())
            result = await uploadPinWithAudio({
               audioBlob,
               ...apiParams,
            })
         }

         const createdPin = convertApiResponseToPin(
            result,
            analysisResult,
            primaryResult,
            duration,
         )

         set((state) => ({
            tempPins: state.tempPins.filter((p) => p.id !== tempPin.id),
            persistedPins: [...state.persistedPins, createdPin],
            pinCreationStatus: "success",
            lastCreatedPinId: createdPin.id,
         }))

         return createdPin
      } catch (error) {
         const errorMessage =
            error instanceof Error ? error.message : "ピン作成に失敗しました"

         set({
            tempPins: [],
            pinCreationStatus: "error",
            pinCreationError: errorMessage,
         })

         throw error
      }
   },

   setPinCreationStatus: (status): void => {
      set({ pinCreationStatus: status })
   },

   setPinCreationError: (error): void => {
      set({ pinCreationError: error })
   },

   mergeLocalAndPersistedPins: (): SoundPin[] => {
      const { pins, persistedPins, tempPins } = get()
      const allPins = [...pins, ...persistedPins, ...tempPins]

      const uniquePins = allPins.filter(
         (pin, index, array) =>
            array.findIndex((p) => p.id === pin.id) === index,
      )

      return uniquePins.sort((a, b) => {
         if (a.isPersisted && !b.isPersisted) return -1
         if (!a.isPersisted && b.isPersisted) return 1
         return b.recordedAt.getTime() - a.recordedAt.getTime()
      })
   },

   loadNearbyPins: async (bounds: MapBounds): Promise<SoundPin[]> => {
      try {
         set({ isLoadingNearbyPins: true, nearbyPinsError: null })

         const result = await fetchNearbyPins(bounds)

         if (!result.success || !result.data) {
            throw new Error("ピン取得結果が不正です")
         }

         const loadedPins: SoundPin[] = (result.data || []).map(
            (dbPin: unknown) => convertDbPinToSoundPin(dbPin),
         )

         set({
            persistedPins: loadedPins,
            isLoadingNearbyPins: false,
            nearbyPinsError: null,
         })

         return loadedPins
      } catch (error) {
         const errorMessage =
            error instanceof Error ? error.message : "ピン取得に失敗しました"

         set({ isLoadingNearbyPins: false, nearbyPinsError: errorMessage })

         throw error
      }
   },

   clearPinCreationState: (): void => {
      set({
         pinCreationStatus: "idle",
         pinCreationError: null,
         lastCreatedPinId: null,
      })
   },
}))
