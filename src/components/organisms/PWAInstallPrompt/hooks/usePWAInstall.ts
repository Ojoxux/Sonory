/**
 * PWAインストール関連のカスタムフック
 */

import { useCallback, useEffect, useState } from 'react'

/** アニメーション遅延時間（ミリ秒） */
const ANIMATION_DELAYS = {
  /** デバッグモードでの展開遅延 */
  DEBUG_EXPAND: 800,
  /** 通常モードでの展開遅延 */
  NORMAL_EXPAND: 1000,
  /** 閉じるアニメーション遅延 */
  CLOSE_ANIMATION: 500,
} as const

/** イベント名 */
const EVENT_NAMES = {
  /** PWAデバッグ表示イベント */
  PWA_DEBUG_SHOW: 'pwa-debug-show',
  /** PWAデバッグ非表示イベント */
  PWA_DEBUG_HIDE: 'pwa-debug-hide',
  /** インストール前プロンプトイベント */
  BEFORE_INSTALL_PROMPT: 'beforeinstallprompt',
  /** アプリインストール完了イベント */
  APP_INSTALLED: 'appinstalled',
} as const

/** メディアクエリ */
const MEDIA_QUERIES = {
  /** スタンドアロンモード */
  STANDALONE: '(display-mode: standalone)',
} as const

/** デバッグメッセージ */
const DEBUG_MESSAGES = {
  /** インストールボタンクリック */
  INSTALL_CLICKED: '[PWA Debug] インストールボタンがクリックされました',
} as const

/**
 * BeforeInstallPromptEvent の型定義
 * PWAインストールプロンプトイベントの標準的な型
 */
export interface BeforeInstallPromptEvent extends Event {
  /** ネイティブインストールプロンプトを表示 */
  prompt: () => Promise<void>
  /** ユーザーの選択結果 */
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

/**
 * デバッグイベントの詳細情報
 */
export interface DebugEventDetail {
  /** 展開状態で表示するかどうか */
  expanded?: boolean
}

/**
 * PWAインストール状態の型定義
 */
export interface PWAInstallState {
  /** 遅延されたインストールプロンプト */
  deferredPrompt: BeforeInstallPromptEvent | null
  /** プロンプトを表示するかどうか */
  showPrompt: boolean
  /** PWAがインストール済みかどうか */
  isInstalled: boolean
  /** プロンプトが展開されているかどうか */
  isExpanded: boolean
  /** デバッグモードが有効かどうか */
  isDebugActive: boolean
  /** プロンプトが表示されているかどうか */
  isVisible: boolean
}

/**
 * PWAが既にインストール済みかチェックするフック
 *
 * @returns インストール状態チェック関数
 */
export function useCheckIfInstalled(): () => boolean {
  return useCallback((): boolean => {
    const isStandalone = window.matchMedia(MEDIA_QUERIES.STANDALONE).matches
    const isWebKit =
      'standalone' in window.navigator &&
      (window.navigator as unknown as { standalone?: boolean }).standalone
    const isAndroidApp = document.referrer.includes('android-app://')

    return isStandalone || Boolean(isWebKit) || isAndroidApp
  }, [])
}

/**
 * PWAインストール状態を管理するフック
 *
 * @param onInstallSuccess - インストール成功時のコールバック
 * @param onDismiss - プロンプトを閉じた時のコールバック
 * @returns PWAインストール状態と操作関数
 */
export function usePWAInstallState(
  onInstallSuccess?: () => void,
  onDismiss?: () => void,
): PWAInstallState & {
  handleInstallClick: () => Promise<void>
  handleDismiss: () => void
  handlePromptClick: () => void
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void
  setShowPrompt: (value: boolean) => void
  setIsInstalled: (value: boolean) => void
  setIsExpanded: (value: boolean) => void
  setIsDebugActive: (value: boolean) => void
  setIsVisible: (value: boolean) => void
} {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState<boolean>(false)
  const [isInstalled, setIsInstalled] = useState<boolean>(false)
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const [isDebugActive, setIsDebugActive] = useState<boolean>(false)
  const [isVisible, setIsVisible] = useState<boolean>(false)

  /**
   * インストールボタンクリック処理
   */
  const handleInstallClick = useCallback(async (): Promise<void> => {
    if (!deferredPrompt && !isDebugActive) return

    if (isDebugActive) {
      console.log(DEBUG_MESSAGES.INSTALL_CLICKED)
      handleDismiss()
      return
    }

    if (!deferredPrompt) return

    try {
      // ネイティブインストールプロンプトを表示
      await deferredPrompt.prompt()

      // ユーザーの選択を待機
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setIsExpanded(false)
        setIsVisible(false)
        // 閉じるアニメーション後に非表示
        setTimeout(() => {
          setShowPrompt(false)
          onInstallSuccess?.()
        }, ANIMATION_DELAYS.CLOSE_ANIMATION)
      }

      // プロンプトを一度だけ使用可能なのでクリア
      setDeferredPrompt(null)
    } catch (error) {
      console.error('PWA install error:', error)
    }
  }, [deferredPrompt, isDebugActive, onInstallSuccess])

  /**
   * プロンプト閉じる処理
   */
  const handleDismiss = useCallback((): void => {
    setIsExpanded(false)
    setIsVisible(false)
    // 閉じるアニメーション後に非表示
    setTimeout(() => {
      setShowPrompt(false)
      setIsDebugActive(false)
      onDismiss?.()
    }, ANIMATION_DELAYS.CLOSE_ANIMATION)
  }, [onDismiss])

  /**
   * プロンプト全体のクリック/タップでトグル
   */
  const handlePromptClick = useCallback((): void => {
    setIsExpanded(!isExpanded)
  }, [isExpanded])

  return {
    deferredPrompt,
    showPrompt,
    isInstalled,
    isExpanded,
    isDebugActive,
    isVisible,
    handleInstallClick,
    handleDismiss,
    handlePromptClick,
    setDeferredPrompt,
    setShowPrompt,
    setIsInstalled,
    setIsExpanded,
    setIsDebugActive,
    setIsVisible,
  }
}

/**
 * デバッグイベントリスナーを管理するフック
 *
 * @param setIsDebugActive - デバッグ状態設定関数
 * @param setShowPrompt - プロンプト表示状態設定関数
 * @param setIsVisible - 表示状態設定関数
 * @param setIsExpanded - 展開状態設定関数
 */
export function useDebugEventListeners(
  setIsDebugActive: (value: boolean) => void,
  setShowPrompt: (value: boolean) => void,
  setIsVisible: (value: boolean) => void,
  setIsExpanded: (value: boolean) => void,
): void {
  useEffect(() => {
    // デバッグメニューからの表示イベント
    const handleDebugShow = (e: CustomEvent<DebugEventDetail>): void => {
      setIsDebugActive(true)
      setShowPrompt(true)
      setIsVisible(true)

      // 展開状態の設定（詳細表示するかどうか）
      if (e.detail?.expanded) {
        setTimeout(() => {
          setIsExpanded(true)
        }, ANIMATION_DELAYS.DEBUG_EXPAND)
      }
    }

    // デバッグメニューからの非表示イベント
    const handleDebugHide = (): void => {
      setIsExpanded(false)
      setIsVisible(false)
      setTimeout(() => {
        setShowPrompt(false)
        setIsDebugActive(false)
      }, ANIMATION_DELAYS.CLOSE_ANIMATION)
    }

    // イベントリスナーの登録
    window.addEventListener(
      EVENT_NAMES.PWA_DEBUG_SHOW,
      handleDebugShow as EventListener,
    )
    window.addEventListener(EVENT_NAMES.PWA_DEBUG_HIDE, handleDebugHide)

    return () => {
      window.removeEventListener(
        EVENT_NAMES.PWA_DEBUG_SHOW,
        handleDebugShow as EventListener,
      )
      window.removeEventListener(EVENT_NAMES.PWA_DEBUG_HIDE, handleDebugHide)
    }
  }, [setIsDebugActive, setShowPrompt, setIsVisible, setIsExpanded])
}

/**
 * PWAインストールイベントリスナーを管理するフック
 *
 * @param autoShow - 自動でプロンプトを表示するかどうか
 * @param debugMode - デバッグモードが有効かどうか
 * @param onInstallSuccess - インストール成功時のコールバック
 * @param setDeferredPrompt - 遅延プロンプト設定関数
 * @param setShowPrompt - プロンプト表示状態設定関数
 * @param setIsVisible - 表示状態設定関数
 * @param setIsExpanded - 展開状態設定関数
 * @param setIsInstalled - インストール状態設定関数
 * @param checkIfInstalled - インストール状態チェック関数
 */
export function usePWAInstallEventListeners(
  autoShow: boolean,
  debugMode: boolean,
  onInstallSuccess: (() => void) | undefined,
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void,
  setShowPrompt: (value: boolean) => void,
  setIsVisible: (value: boolean) => void,
  setIsExpanded: (value: boolean) => void,
  setIsInstalled: (value: boolean) => void,
  checkIfInstalled: () => boolean,
): void {
  useEffect(() => {
    // PWAが既にインストール済みかチェック
    if (checkIfInstalled()) {
      setIsInstalled(true)
      return
    }

    // beforeinstallprompt イベントをリッスン
    const handleBeforeInstallPrompt = (e: Event): void => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      if (autoShow && !debugMode) {
        // まず小さい表示で出現
        setShowPrompt(true)
        setIsVisible(true)

        // 通常モードでは少し遅らせて展開（Dynamic Island風）
        setTimeout(() => {
          setIsExpanded(true)
        }, ANIMATION_DELAYS.NORMAL_EXPAND)
      }
    }

    // appinstalled イベントをリッスン
    const handleAppInstalled = (): void => {
      setIsExpanded(false)
      setIsVisible(false)
      setTimeout(() => {
        setIsInstalled(true)
        setShowPrompt(false)
        onInstallSuccess?.()
      }, ANIMATION_DELAYS.CLOSE_ANIMATION)
    }

    window.addEventListener(
      EVENT_NAMES.BEFORE_INSTALL_PROMPT,
      handleBeforeInstallPrompt,
    )
    window.addEventListener(EVENT_NAMES.APP_INSTALLED, handleAppInstalled)

    return () => {
      window.removeEventListener(
        EVENT_NAMES.BEFORE_INSTALL_PROMPT,
        handleBeforeInstallPrompt,
      )
      window.removeEventListener(EVENT_NAMES.APP_INSTALLED, handleAppInstalled)
    }
  }, [
    autoShow,
    debugMode,
    onInstallSuccess,
    setDeferredPrompt,
    setShowPrompt,
    setIsVisible,
    setIsExpanded,
    setIsInstalled,
    checkIfInstalled,
  ])
}
