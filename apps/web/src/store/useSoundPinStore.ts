import { create } from 'zustand'
import type { AudioData, InferenceResult } from './types'

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
}

/**
 * 音声ピンストアの状態型定義
 */
export type SoundPinState = {
   /** 保存されている音声ピンの配列 */
   pins: SoundPin[]
   /** 選択中のピンID */
   selectedPinId: string | null
   /** ピンを追加 */
   addPin: (
      pin: Omit<
         SoundPin,
         'id' | 'recordedAt' | 'primaryLabel' | 'primaryConfidence'
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
 * 音声ピン管理用Zustandストア
 *
 * @description
 * 録音地点と分類結果を組み合わせた音声ピンの状態を管理します。
 * マップ上での表示と選択状態を制御します。
 */
export const useSoundPinStore = create<SoundPinState>((set, get) => ({
   pins: [],
   selectedPinId: null,

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
         primaryLabel: primaryResult?.label ?? '不明',
         primaryConfidence: primaryResult?.confidence ?? 0,
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
      set({ pins: [], selectedPinId: null })
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
      const { pins } = get()
      return pins.filter((pin) => {
         const distance = calculateDistance(
            latitude,
            longitude,
            pin.latitude,
            pin.longitude,
         )
         return distance <= radiusKm
      })
   },
}))
