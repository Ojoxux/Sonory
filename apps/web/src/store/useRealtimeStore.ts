import { createClient } from "@supabase/supabase-js"
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js"
import { create } from "zustand"
import type { LocationData } from "./useSoundPinStore"

/**
 * リアルタイム通知の型定義
 */
export interface RealtimeNotification {
   /** 通知の一意識別子 */
   id: string
   /** 通知タイプ */
   type: "new_pin" | "pin_analysis_complete"
   /** 関連するピンID */
   pinId: string
   /** ピンの位置情報 */
   location: { lat: number; lng: number }
   /** ユーザーからの距離（メートル） */
   distance: number
   /** 通知発生時刻 */
   timestamp: Date
   /** 既読状態 */
   isRead: boolean
   /** 追加データ */
   data?: {
      title?: string
      primaryLabel?: string
      confidence?: number
   }
}

/**
 * ピンデータの型定義
 */
interface PinData {
   id: string
   location: { coordinates: [number, number] }
   title?: string
   ai_analysis?: {
      categories?: { topic?: string; confidence?: number }
   }
}

/**
 * 通知設定の型定義
 */
export interface NotificationSettings {
   /** 通知機能の有効/無効 */
   enabled: boolean
   /** 音声アラートの有効/無効 */
   soundEnabled: boolean
   /** 振動アラートの有効/無効 */
   vibrationEnabled: boolean
   /** 通知範囲（メートル） */
   maxDistance: number
}

/**
 * 接続状態の型定義
 */
export type ConnectionStatus =
   | "connecting"
   | "connected"
   | "disconnected"
   | "error"

/**
 * リアルタイムストアの状態型定義
 */
export interface RealtimeState {
   /** 接続状態 */
   isConnected: boolean
   /** 詳細な接続状態 */
   connectionStatus: ConnectionStatus
   /** 購読中のチャンネルID配列 */
   subscribedChannels: string[]
   /** 最近の通知配列 */
   recentNotifications: RealtimeNotification[]
   /** 通知設定 */
   notificationSettings: NotificationSettings
   /** 接続エラーメッセージ */
   connectionError: string | null
   /** 現在のユーザー位置 */
   userLocation: LocationData | null
   /** Supabaseクライアント */
   supabaseClient: SupabaseClient | null
   /** アクティブなチャンネル */
   activeChannels: Map<string, RealtimeChannel>
}

/**
 * リアルタイムストアのアクション型定義
 */
export interface RealtimeActions {
   /** リアルタイム接続を開始 */
   connectRealtime: () => Promise<void>
   /** リアルタイム接続を切断 */
   disconnectRealtime: () => void
   /** 近隣ピンの購読を開始 */
   subscribeToNearbyPins: (userLocation: LocationData, radius: number) => void
   /** チャンネルの購読を解除 */
   unsubscribeFromChannel: (channelId: string) => void
   /** 新ピン通知を処理 */
   handleNewPinNotification: (payload: Record<string, unknown>) => void
   /** 通知を既読にする */
   markNotificationAsRead: (notificationId: string) => void
   /** 通知設定を更新 */
   updateNotificationSettings: (settings: Partial<NotificationSettings>) => void
   /** ユーザー位置を更新 */
   updateUserLocation: (location: LocationData) => void
   /** 通知履歴をクリア */
   clearNotifications: () => void
   /** 接続状態を設定 */
   setConnectionStatus: (status: ConnectionStatus) => void
   /** 接続エラーを設定 */
   setConnectionError: (error: string | null) => void
}

/**
 * 2点間の距離を計算（ハーバーサイン公式）
 *
 * @param lat1 - 地点1の緯度
 * @param lon1 - 地点1の経度
 * @param lat2 - 地点2の緯度
 * @param lon2 - 地点2の経度
 * @returns 距離（メートル）
 */
function calculateDistance(
   lat1: number,
   lon1: number,
   lat2: number,
   lon2: number,
): number {
   const R = 6371000 // 地球の半径（メートル）
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
 * 通知IDを生成
 *
 * @returns 一意の通知ID
 */
function generateNotificationId(): string {
   return `notification_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * ピンデータの型ガード
 *
 * @param data - チェックするデータ
 * @returns ピンデータかどうか
 */
function isPinData(data: unknown): data is PinData {
   if (typeof data !== "object" || data === null) return false

   const obj = data as Record<string, unknown>

   if (typeof obj.id !== "string") return false
   if (typeof obj.location !== "object" || obj.location === null) return false

   const location = obj.location as Record<string, unknown>
   if (!Array.isArray(location.coordinates)) return false
   if (location.coordinates.length !== 2) return false
   if (typeof location.coordinates[0] !== "number") return false
   if (typeof location.coordinates[1] !== "number") return false

   return true
}

/**
 * デフォルトの通知設定
 */
const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
   enabled: true,
   soundEnabled: true,
   vibrationEnabled: true,
   maxDistance: 1000, // 1km
}

/**
 * リアルタイム通知管理用Zustandストア
 *
 * @description
 * Supabase Realtimeを使用して新しいピンの通知を管理します。
 * 地理的範囲フィルタリング、通知設定、接続状態管理を提供します。
 */
export const useRealtimeStore = create<RealtimeState & RealtimeActions>(
   (set, get) => ({
      // 初期状態
      isConnected: false,
      connectionStatus: "disconnected",
      subscribedChannels: [],
      recentNotifications: [],
      notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
      connectionError: null,
      userLocation: null,
      supabaseClient: null,
      activeChannels: new Map(),

      /**
       * リアルタイム接続を開始します
       */
      connectRealtime: async (): Promise<void> => {
         try {
            set({ connectionStatus: "connecting", connectionError: null })

            // Supabaseクライアントを初期化
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

            if (!supabaseUrl || !supabaseAnonKey) {
               throw new Error("Supabase設定が不正です")
            }

            const client = createClient(supabaseUrl, supabaseAnonKey)

            set({
               supabaseClient: client,
               connectionStatus: "connected",
               isConnected: true,
            })

            console.log("✅ Supabase Realtime接続完了")
         } catch (error) {
            const errorMessage =
               error instanceof Error ? error.message : "接続に失敗しました"

            set({
               connectionStatus: "error",
               connectionError: errorMessage,
               isConnected: false,
            })

            console.error("❌ Supabase Realtime接続失敗:", error)
            throw error
         }
      },

      /**
       * リアルタイム接続を切断します
       */
      disconnectRealtime: (): void => {
         const { activeChannels, supabaseClient } = get()

         // 全チャンネルの購読を解除
         for (const [channelId, channel] of activeChannels) {
            channel.unsubscribe()
            console.log(`🔌 チャンネル購読解除: ${channelId}`)
         }

         // Supabaseクライアントを切断
         if (supabaseClient) {
            supabaseClient.removeAllChannels()
         }

         set({
            isConnected: false,
            connectionStatus: "disconnected",
            subscribedChannels: [],
            activeChannels: new Map(),
            supabaseClient: null,
            connectionError: null,
         })

         console.log("🔌 Supabase Realtime切断完了")
      },

      /**
       * 近隣ピンの購読を開始します
       *
       * @param userLocation - ユーザーの現在位置
       * @param radius - 購読範囲（メートル）
       */
      subscribeToNearbyPins: (
         userLocation: LocationData,
         radius: number,
      ): void => {
         const { supabaseClient, activeChannels, notificationSettings } = get()

         if (!supabaseClient || !notificationSettings.enabled) {
            console.log("⚠️ Realtime未接続または通知無効")
            return
         }

         const channelId = `sound-pins-${userLocation.latitude.toFixed(4)}-${userLocation.longitude.toFixed(4)}`

         // 既存チャンネルがある場合は解除
         if (activeChannels.has(channelId)) {
            const existingChannel = activeChannels.get(channelId)
            existingChannel?.unsubscribe()
         }

         // 新しいチャンネルを作成
         const channel = supabaseClient
            .channel(channelId)
            .on(
               "postgres_changes",
               {
                  event: "INSERT",
                  schema: "public",
                  table: "sound_pins",
               },
               (payload) => {
                  get().handleNewPinNotification(payload.new)
               },
            )
            .on(
               "postgres_changes",
               {
                  event: "UPDATE",
                  schema: "public",
                  table: "sound_pins",
                  filter: "ai_analysis.neq.null",
               },
               (payload) => {
                  // AI分析完了通知
                  if (!isPinData(payload.new)) {
                     console.warn("⚠️ 無効なピンデータ")
                     return
                  }

                  const pinData = payload.new

                  if (pinData.location?.coordinates) {
                     const [lng, lat] = pinData.location.coordinates
                     const distance = calculateDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        lat,
                        lng,
                     )

                     if (distance <= notificationSettings.maxDistance) {
                        const notification: RealtimeNotification = {
                           id: generateNotificationId(),
                           type: "pin_analysis_complete",
                           pinId: pinData.id,
                           location: { lat, lng },
                           distance: Math.round(distance),
                           timestamp: new Date(),
                           isRead: false,
                           data: {
                              title: pinData.title || "音声ピン",
                           },
                        }

                        set((state) => ({
                           recentNotifications: [
                              notification,
                              ...state.recentNotifications,
                           ].slice(0, 50),
                        }))

                        console.log("🔔 AI分析完了通知:", notification)
                     }
                  }
               },
            )
            .subscribe()

         // チャンネルを管理に追加
         const newActiveChannels = new Map(activeChannels)
         newActiveChannels.set(channelId, channel)

         set((state) => ({
            activeChannels: newActiveChannels,
            subscribedChannels: [...state.subscribedChannels, channelId],
            userLocation,
         }))

         console.log(`📡 近隣ピン購読開始: ${channelId} (半径: ${radius}m)`)
      },

      /**
       * チャンネルの購読を解除します
       *
       * @param channelId - 解除するチャンネルID
       */
      unsubscribeFromChannel: (channelId: string): void => {
         const { activeChannels } = get()

         const channel = activeChannels.get(channelId)
         if (channel) {
            channel.unsubscribe()
            const newActiveChannels = new Map(activeChannels)
            newActiveChannels.delete(channelId)

            set((state) => ({
               activeChannels: newActiveChannels,
               subscribedChannels: state.subscribedChannels.filter(
                  (id) => id !== channelId,
               ),
            }))

            console.log(`🔌 チャンネル購読解除: ${channelId}`)
         }
      },

      /**
       * 新ピン通知を処理します
       *
       * @param payload - Supabaseからのペイロード
       */
      handleNewPinNotification: (payload: Record<string, unknown>): void => {
         const { userLocation, notificationSettings } = get()

         if (!userLocation || !notificationSettings.enabled) {
            return
         }

         try {
            if (!isPinData(payload)) {
               console.warn("⚠️ 無効なピンデータ")
               return
            }

            const pinData = payload

            if (!pinData.location?.coordinates) {
               console.warn("⚠️ ピンデータに位置情報がありません")
               return
            }

            const [lng, lat] = pinData.location.coordinates
            const distance = calculateDistance(
               userLocation.latitude,
               userLocation.longitude,
               lat,
               lng,
            )

            // 通知範囲内かチェック
            if (distance > notificationSettings.maxDistance) {
               return
            }

            const notification: RealtimeNotification = {
               id: generateNotificationId(),
               type: "new_pin",
               pinId: pinData.id,
               location: { lat, lng },
               distance: Math.round(distance),
               timestamp: new Date(),
               isRead: false,
               data: {
                  title: pinData.title || "音声ピン",
                  primaryLabel: pinData.ai_analysis?.categories?.topic,
                  confidence: pinData.ai_analysis?.categories?.confidence,
               },
            }

            set((state) => ({
               recentNotifications: [
                  notification,
                  ...state.recentNotifications,
               ].slice(0, 50),
            }))

            // 音声・振動アラート
            if (notificationSettings.soundEnabled) {
               // ブラウザ通知音（可能な場合）
               if ("Audio" in window) {
                  try {
                     const audio = new Audio("/sounds/notification.mp3")
                     audio.volume = 0.3
                     audio.play().catch(() => {
                        // 音声再生失敗は無視
                     })
                  } catch {
                     // Audio作成失敗は無視
                  }
               }
            }

            if (
               notificationSettings.vibrationEnabled &&
               "vibrate" in navigator
            ) {
               navigator.vibrate([200, 100, 200])
            }

            console.log("🔔 新ピン通知:", notification)
         } catch (error) {
            console.error("❌ 新ピン通知処理エラー:", error)
         }
      },

      /**
       * 通知を既読にします
       *
       * @param notificationId - 既読にする通知ID
       */
      markNotificationAsRead: (notificationId: string): void => {
         set((state) => ({
            recentNotifications: state.recentNotifications.map(
               (notification) =>
                  notification.id === notificationId
                     ? { ...notification, isRead: true }
                     : notification,
            ),
         }))
      },

      /**
       * 通知設定を更新します
       *
       * @param settings - 更新する設定
       */
      updateNotificationSettings: (
         settings: Partial<NotificationSettings>,
      ): void => {
         set((state) => ({
            notificationSettings: {
               ...state.notificationSettings,
               ...settings,
            },
         }))

         console.log("⚙️ 通知設定更新:", settings)
      },

      /**
       * ユーザー位置を更新します
       *
       * @param location - 新しい位置情報
       */
      updateUserLocation: (location: LocationData): void => {
         set({ userLocation: location })
      },

      /**
       * 通知履歴をクリアします
       */
      clearNotifications: (): void => {
         set({ recentNotifications: [] })
      },

      /**
       * 接続状態を設定します
       *
       * @param status - 設定する接続状態
       */
      setConnectionStatus: (status: ConnectionStatus): void => {
         set({
            connectionStatus: status,
            isConnected: status === "connected",
         })
      },

      /**
       * 接続エラーを設定します
       *
       * @param error - エラーメッセージ
       */
      setConnectionError: (error: string | null): void => {
         set({ connectionError: error })
      },
   }),
)
