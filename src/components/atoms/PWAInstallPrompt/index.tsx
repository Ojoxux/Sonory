'use client'

import { useDebugStore } from '@/store/useDebugStore'
import { useEffect, useRef, useState } from 'react'
import { MdClose, MdInstallMobile } from 'react-icons/md'
import type { PWAInstallPromptProps } from './type'

/**
 * PWAインストールプロンプトコンポーネント
 *
 * @description
 * PWAのインストールを促すDynamic Island風のAtomコンポーネント
 * beforeinstallprompt イベントを利用してネイティブプロンプトを表示
 *
 * @example
 * ```tsx
 * <PWAInstallPrompt />
 * ```
 *
 * デバッグモード:
 * 1. Shift+D でグローバルデバッグモードを有効化
 * 2. PWAインストールプロンプトをテスト表示（自動的に表示されます）
 * 3. デバッグメニューからプロンプトの表示/非表示を操作可能
 */
export function PWAInstallPrompt({
  className = '',
  autoShow = true,
  onInstallSuccess,
  onDismiss,
}: PWAInstallPromptProps) {
  const { debugMode } = useDebugStore()
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDebugActive, setIsDebugActive] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // アニメーションのスタイル計算用
  const promptRef = useRef<HTMLDivElement>(null)

  // デバッグイベントリスナー
  useEffect(() => {
    // デバッグメニューからの表示イベント
    const handleDebugShow = (e: CustomEvent) => {
      setIsDebugActive(true)
      setShowPrompt(true)
      setIsVisible(true)

      // 展開状態の設定（詳細表示するかどうか）
      if (e.detail?.expanded) {
        setTimeout(() => {
          setIsExpanded(true)
        }, 800)
      }
    }

    // デバッグメニューからの非表示イベント
    const handleDebugHide = () => {
      setIsExpanded(false)
      setIsVisible(false)
      setTimeout(() => {
        setShowPrompt(false)
        setIsDebugActive(false)
      }, 500)
    }

    // イベントリスナーの登録
    window.addEventListener('pwa-debug-show', handleDebugShow as EventListener)
    window.addEventListener('pwa-debug-hide', handleDebugHide)

    return () => {
      window.removeEventListener(
        'pwa-debug-show',
        handleDebugShow as EventListener,
      )
      window.removeEventListener('pwa-debug-hide', handleDebugHide)
    }
  }, [])

  // デバッグモードが有効になったらプロンプトを表示
  useEffect(() => {
    if (debugMode && !showPrompt && !isInstalled) {
      setIsDebugActive(true)
      setShowPrompt(true)
      setIsVisible(true)
    }
  }, [debugMode, showPrompt, isInstalled])

  useEffect(() => {
    // PWAが既にインストール済みかチェック
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia(
        '(display-mode: standalone)',
      ).matches
      const isWebKit =
        'standalone' in window.navigator && (window.navigator as any).standalone
      const isAndroidApp = document.referrer.includes('android-app://')

      return isStandalone || isWebKit || isAndroidApp
    }

    if (checkIfInstalled()) {
      setIsInstalled(true)
      return
    }

    // beforeinstallprompt イベントをリッスン
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)

      if (autoShow && !debugMode) {
        // まず小さい表示で出現
        setShowPrompt(true)
        setIsVisible(true)

        // 通常モードでは少し遅らせて展開（Dynamic Island風）
        setTimeout(() => {
          setIsExpanded(true)
        }, 1000)
      }
    }

    // appinstalled イベントをリッスン
    const handleAppInstalled = () => {
      setIsExpanded(false)
      setIsVisible(false)
      setTimeout(() => {
        setIsInstalled(true)
        setShowPrompt(false)
        onInstallSuccess?.()
      }, 500)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      )
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [autoShow, onInstallSuccess, debugMode])

  const handleInstallClick = async () => {
    if (!deferredPrompt && !isDebugActive) return

    if (isDebugActive) {
      console.log('[PWA Debug] インストールボタンがクリックされました')
      handleDismiss()
      return
    }

    // ネイティブインストールプロンプトを表示
    deferredPrompt.prompt()

    // ユーザーの選択を待機
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setIsExpanded(false)
      setIsVisible(false)
      // 閉じるアニメーション後に非表示
      setTimeout(() => {
        setShowPrompt(false)
        onInstallSuccess?.()
      }, 500)
    }

    // プロンプトを一度だけ使用可能なのでクリア
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setIsExpanded(false)
    setIsVisible(false)
    // 閉じるアニメーション後に非表示
    setTimeout(() => {
      setShowPrompt(false)
      setIsDebugActive(false)
      onDismiss?.()
    }, 500)
  }

  // プロンプト全体のクリック/タップでトグル
  const handlePromptClick = () => {
    setIsExpanded(!isExpanded)
  }

  // インストール済みまたは表示しない場合は何も表示しない
  if (isInstalled || !showPrompt || (!deferredPrompt && !isDebugActive)) {
    return null
  }

  return (
    <div
      className={`fixed top-6 left-0 right-0 z-[200] pointer-events-auto flex justify-center ${className}`}
    >
      <div
        ref={promptRef}
        onClick={handlePromptClick}
        className={`
          bg-black text-white shadow-lg
          backdrop-blur-lg 
          cursor-pointer
          transition-all duration-300 ease-out
          ${isDebugActive ? 'border border-blue-500' : ''}
          ${!isVisible ? 'opacity-0 translate-y-[-20px] scale-75' : 'opacity-100 translate-y-0'}
          ${
            isExpanded
              ? 'rounded-2xl w-[95%] max-w-96 px-5 py-4 scale-100'
              : 'rounded-2xl w-auto max-w-none px-4 py-2 scale-90 hover:scale-95'
          }
        `}
        style={{
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div className="flex items-center gap-3 relative">
          <div
            className={`
            flex-shrink-0 w-8 h-8 bg-white rounded-full
            flex items-center justify-center
            transition-all duration-300
          `}
          >
            <MdInstallMobile
              className={`
              w-4 h-4 text-black
              transition-transform duration-300
              ${isExpanded ? 'scale-110' : 'scale-100'}
            `}
            />
          </div>

          {isExpanded ? (
            <div className="flex-1 min-w-0 overflow-hidden">
              <h3 className="text-sm font-semibold text-white mb-1">
                {isDebugActive ? '[デバッグ] ' : ''}Sonoryをインストール
              </h3>
              <p className="text-xs text-gray-300 mb-3 leading-relaxed">
                ホーム画面に追加して、より快適にご利用いただけます
              </p>

              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={handleInstallClick}
                  className="flex-1 bg-white text-black text-xs font-medium px-3 py-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  インストール
                </button>
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-2"
                  aria-label="閉じる"
                >
                  <MdClose className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <span className="text-xs font-medium whitespace-nowrap">
              {isDebugActive ? '[デバッグ] ' : ''}インストールしませんか？
            </span>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulseOnce {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
          }
          70% {
            transform: scale(1.1);
            box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
          }
        }

        @keyframes slideInRight {
          0% {
            transform: translateX(20px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideInUp {
          0% {
            transform: translateY(10px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideOutDown {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(10px);
            opacity: 0;
          }
        }

        .animate-pulse-once {
          animation: pulseOnce 1s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-slide-in-right {
          animation: slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .animate-slide-in-up {
          animation: slideInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .animate-slide-out-down {
          animation: slideOutDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .animation-delay-100 {
          animation-delay: 0.1s;
        }

        .animation-delay-150 {
          animation-delay: 0.15s;
        }
      `}</style>
    </div>
  )
}
