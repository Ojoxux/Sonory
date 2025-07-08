/**
 * PWA通知機能ユーティリティ
 *
 * @description
 * Push通知権限要求、バックグラウンド通知、Service Worker統合を提供します。
 * ブラウザの通知API、振動API、Service Workerとの連携を管理します。
 */

/**
 * 通知権限の状態型定義
 */
export type NotificationPermissionStatus = "granted" | "denied" | "default"

/**
 * 通知オプションの型定義
 */
export interface SonoryNotificationOptions extends NotificationOptions {
   /** 通知タグ（重複防止用） */
   tag?: string
   /** 振動パターン */
   vibrate?: number[]
   /** 通知データ */
   data?: {
      pinId?: string
      type?: "new_pin" | "pin_analysis_complete"
      location?: { lat: number; lng: number }
   }
}

/**
 * 通知統計の型定義
 */
export interface NotificationStats {
   /** 送信された通知数 */
   sent: number
   /** クリックされた通知数 */
   clicked: number
   /** 権限状態 */
   permission: NotificationPermissionStatus
   /** Service Worker登録状態 */
   serviceWorkerRegistered: boolean
}

/**
 * Push通知権限を要求します
 *
 * @returns 権限が許可されたかどうか
 */
export async function requestNotificationPermission(): Promise<boolean> {
   // 通知APIサポートチェック
   if (!("Notification" in window)) {
      console.warn("⚠️ このブラウザは通知をサポートしていません")
      return false
   }

   // 既に許可されている場合
   if (Notification.permission === "granted") {
      return true
   }

   // 既に拒否されている場合
   if (Notification.permission === "denied") {
      console.warn("⚠️ 通知権限が拒否されています")
      return false
   }

   try {
      // 権限要求
      const permission = await Notification.requestPermission()
      const granted = permission === "granted"

      if (granted) {
         console.log("✅ 通知権限が許可されました")
      } else {
         console.warn("⚠️ 通知権限が拒否されました")
      }

      return granted
   } catch (error) {
      console.error("❌ 通知権限要求エラー:", error)
      return false
   }
}

/**
 * 通知権限の現在の状態を取得します
 *
 * @returns 現在の権限状態
 */
export function getNotificationPermission(): NotificationPermissionStatus {
   if (!("Notification" in window)) {
      return "denied"
   }
   return Notification.permission as NotificationPermissionStatus
}

/**
 * 通知を送信します
 *
 * @param title - 通知タイトル
 * @param options - 通知オプション
 * @returns 送信された通知オブジェクト
 */
export function sendNotification(
   title: string,
   options: SonoryNotificationOptions = {},
): Notification | null {
   // 権限チェック
   if (getNotificationPermission() !== "granted") {
      console.warn("⚠️ 通知権限がありません")
      return null
   }

   try {
      // デフォルトオプション
      const defaultOptions: SonoryNotificationOptions = {
         icon: "/icons/icon-192x192.png",
         badge: "/icons/icon-72x72.png",
         vibrate: [200, 100, 200],
         tag: "sonory-notification",
         requireInteraction: false,
         silent: false,
         ...options,
      }

      // 通知作成
      const notification = new Notification(title, defaultOptions)

      // クリックイベント処理
      notification.onclick = (event) => {
         event.preventDefault()

         // ウィンドウにフォーカス
         if (window.parent) {
            window.parent.focus()
         } else {
            window.focus()
         }

         // ピンの位置に移動（データがある場合）
         if (options.data?.pinId) {
            handleNotificationClick(options.data)
         }

         // 通知を閉じる
         notification.close()
      }

      // エラーイベント処理
      notification.onerror = (error) => {
         console.error("❌ 通知エラー:", error)
      }

      // 自動閉じる（5秒後）
      setTimeout(() => {
         notification.close()
      }, 5000)

      console.log("📢 通知送信:", title)
      return notification
   } catch (error) {
      console.error("❌ 通知送信エラー:", error)
      return null
   }
}

/**
 * 新ピン通知を送信します
 *
 * @param pinData - ピンデータ
 * @param distance - ユーザーからの距離（メートル）
 */
export function sendNewPinNotification(
   pinData: {
      id: string
      title?: string
      primaryLabel?: string
      location: { lat: number; lng: number }
   },
   distance: number,
): void {
   const distanceText =
      distance < 1000
         ? `${Math.round(distance)}m先`
         : `${(distance / 1000).toFixed(1)}km先`

   const title = "新しい音声ピンが投稿されました"
   const body = `${distanceText}に新しい音声が投稿されました`
   const soundLabel = pinData.primaryLabel ? `🎵 ${pinData.primaryLabel}` : ""

   sendNotification(title, {
      body: `${body}\n${soundLabel}`,
      tag: `new-pin-${pinData.id}`,
      data: {
         pinId: pinData.id,
         type: "new_pin",
         location: pinData.location,
      },
   })
}

/**
 * AI分析完了通知を送信します
 *
 * @param pinData - ピンデータ
 * @param analysisResult - 分析結果
 */
export function sendAnalysisCompleteNotification(
   pinData: {
      id: string
      title?: string
      location: { lat: number; lng: number }
   },
   analysisResult: {
      primaryLabel: string
      confidence: number
   },
): void {
   const title = "音声分析が完了しました"
   const confidenceText = `${Math.round(analysisResult.confidence * 100)}%`
   const body = `🎵 ${analysisResult.primaryLabel} (信頼度: ${confidenceText})`

   sendNotification(title, {
      body,
      tag: `analysis-complete-${pinData.id}`,
      data: {
         pinId: pinData.id,
         type: "pin_analysis_complete",
         location: pinData.location,
      },
   })
}

/**
 * 通知クリック時の処理
 *
 * @param data - 通知データ
 */
function handleNotificationClick(data: {
   pinId?: string
   type?: "new_pin" | "pin_analysis_complete"
   location?: { lat: number; lng: number }
}): void {
   // カスタムイベントを発火してアプリに通知
   const event = new CustomEvent("sonory-notification-click", {
      detail: data,
   })
   window.dispatchEvent(event)

   console.log("🔔 通知クリック:", data)
}

/**
 * Service Workerの通知ハンドラーを登録します
 */
export function registerNotificationHandlers(): void {
   // Service Workerサポートチェック
   if (!("serviceWorker" in navigator)) {
      console.warn("⚠️ Service Workerがサポートされていません")
      return
   }

   // Service Workerからのメッセージを受信
   navigator.serviceWorker.addEventListener("message", (event) => {
      const { type, payload } = event.data

      switch (type) {
         case "NEW_PIN_NOTIFICATION":
            if (payload.pinData && payload.distance) {
               sendNewPinNotification(payload.pinData, payload.distance)
            }
            break

         case "ANALYSIS_COMPLETE_NOTIFICATION":
            if (payload.pinData && payload.analysisResult) {
               sendAnalysisCompleteNotification(
                  payload.pinData,
                  payload.analysisResult,
               )
            }
            break

         default:
            console.log("📨 Service Workerメッセージ:", event.data)
      }
   })

   console.log("📡 通知ハンドラー登録完了")
}

/**
 * 振動を実行します
 *
 * @param pattern - 振動パターン（ミリ秒配列）
 */
export function vibrate(pattern: number[] = [200, 100, 200]): void {
   if ("vibrate" in navigator) {
      navigator.vibrate(pattern)
   }
}

/**
 * 通知統計を取得します
 *
 * @returns 通知統計
 */
export function getNotificationStats(): NotificationStats {
   const stats: NotificationStats = {
      sent: Number.parseInt(
         localStorage.getItem("sonory-notifications-sent") || "0",
      ),
      clicked: Number.parseInt(
         localStorage.getItem("sonory-notifications-clicked") || "0",
      ),
      permission: getNotificationPermission(),
      serviceWorkerRegistered: "serviceWorker" in navigator,
   }

   return stats
}

/**
 * 通知統計を更新します
 *
 * @param type - 更新タイプ
 */
export function updateNotificationStats(type: "sent" | "clicked"): void {
   const key = `sonory-notifications-${type}`
   const current = Number.parseInt(localStorage.getItem(key) || "0")
   localStorage.setItem(key, (current + 1).toString())
}

/**
 * 通知統計をリセットします
 */
export function resetNotificationStats(): void {
   localStorage.removeItem("sonory-notifications-sent")
   localStorage.removeItem("sonory-notifications-clicked")
}

/**
 * 通知機能の初期化
 *
 * @description
 * アプリ起動時に呼び出して通知機能を初期化します。
 * Service Workerハンドラー登録、権限チェックを行います。
 */
export async function initializeNotifications(): Promise<void> {
   try {
      // Service Workerハンドラー登録
      registerNotificationHandlers()

      // 通知クリックイベントリスナー登録
      window.addEventListener("sonory-notification-click", (event) => {
         const customEvent = event as CustomEvent
         updateNotificationStats("clicked")
         console.log("🔔 通知クリック統計更新:", customEvent.detail)
      })

      console.log("✅ 通知機能初期化完了")
   } catch (error) {
      console.error("❌ 通知機能初期化エラー:", error)
   }
}

/**
 * 通知テストを実行します
 *
 * @description
 * 開発・デバッグ用の通知テスト機能です。
 */
export async function testNotification(): Promise<void> {
   const hasPermission = await requestNotificationPermission()

   if (!hasPermission) {
      console.warn("⚠️ 通知権限がないためテストできません")
      return
   }

   sendNotification("Sonory通知テスト", {
      body: "通知機能が正常に動作しています 🎵",
      tag: "test-notification",
      data: {
         type: "new_pin",
         pinId: "test-pin-id",
      },
   })

   console.log("🧪 通知テスト実行")
}
