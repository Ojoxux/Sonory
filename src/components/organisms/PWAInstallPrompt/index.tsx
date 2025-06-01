'use client'

import { CloseButton } from '@/components/atoms/CloseButton'
import { InstallButton } from '@/components/atoms/InstallButton'
import { InstallIcon } from '@/components/atoms/InstallIcon'
import { useDebugStore } from '@/store/useDebugStore'
import { memo, useEffect, useRef } from 'react'
import {
  useCheckIfInstalled,
  useDebugEventListeners,
  usePWAInstallEventListeners,
  usePWAInstallState,
} from './hooks/usePWAInstall'
import type { PWAInstallPromptProps } from './types'

/** テキストコンテンツ */
const TEXT_CONTENT = {
  /** デバッグプレフィックス */
  DEBUG_PREFIX: '[デバッグ] ',
  /** インストールタイトル */
  INSTALL_TITLE: 'Sonoryをインストール',
  /** インストール説明 */
  INSTALL_DESCRIPTION: 'ホーム画面に追加して、より快適にご利用いただけます',
  /** インストールボタン */
  INSTALL_BUTTON: 'インストール',
  /** 縮小時のテキスト */
  COLLAPSED_TEXT: 'インストールしませんか？',
  /** 閉じるボタンのアクセシビリティラベル */
  CLOSE_ARIA_LABEL: '閉じる',
} as const

/** CSS クラス名 */
const CSS_CLASSES = {
  /** コンテナのベースクラス */
  CONTAINER_BASE:
    'fixed top-6 left-0 right-0 z-[200] pointer-events-auto flex justify-center',
  /** プロンプトのベースクラス */
  PROMPT_BASE:
    'bg-black text-white shadow-lg backdrop-blur-lg cursor-pointer transition-all duration-300 ease-out',
  /** デバッグ時のボーダー */
  DEBUG_BORDER: 'border border-blue-500',
  /** 展開時のスタイル */
  EXPANDED: 'rounded-2xl w-[95%] max-w-96 px-5 py-4 scale-100',
  /** 縮小時のスタイル */
  COLLAPSED: 'rounded-2xl w-auto max-w-none px-4 py-2 scale-90 hover:scale-95',
  /** 非表示時のスタイル */
  HIDDEN: 'opacity-0 translate-y-[-20px] scale-75',
  /** 表示時のスタイル */
  VISIBLE: 'opacity-100 translate-y-0',
} as const

/**
 * プロンプトコンテナのスタイルを生成する関数
 */
function getPromptContainerClassName(
  isDebugActive: boolean,
  isVisible: boolean,
  isExpanded: boolean,
): string {
  const baseClasses = CSS_CLASSES.PROMPT_BASE
  const debugClasses = isDebugActive ? CSS_CLASSES.DEBUG_BORDER : ''
  const visibilityClasses = !isVisible
    ? CSS_CLASSES.HIDDEN
    : CSS_CLASSES.VISIBLE
  const sizeClasses = isExpanded ? CSS_CLASSES.EXPANDED : CSS_CLASSES.COLLAPSED

  return `${baseClasses} ${debugClasses} ${visibilityClasses} ${sizeClasses}`.trim()
}

/**
 * 展開時のコンテンツコンポーネント
 */
const ExpandedContent = memo(function ExpandedContent({
  isDebugActive,
  onInstallClick,
  onDismiss,
}: {
  isDebugActive: boolean
  onInstallClick: () => Promise<void>
  onDismiss: () => void
}) {
  return (
    <div className="flex-1 min-w-0 overflow-hidden">
      <h3 className="text-sm font-semibold text-white mb-1">
        {isDebugActive ? TEXT_CONTENT.DEBUG_PREFIX : ''}
        {TEXT_CONTENT.INSTALL_TITLE}
      </h3>
      <p className="text-xs text-gray-300 mb-3 leading-relaxed">
        {TEXT_CONTENT.INSTALL_DESCRIPTION}
      </p>

      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <InstallButton onClick={onInstallClick}>
          {TEXT_CONTENT.INSTALL_BUTTON}
        </InstallButton>
        <CloseButton
          onClick={onDismiss}
          ariaLabel={TEXT_CONTENT.CLOSE_ARIA_LABEL}
        />
      </div>
    </div>
  )
})

/**
 * 縮小時のコンテンツコンポーネント
 */
const CollapsedContent = memo(function CollapsedContent({
  isDebugActive,
}: {
  isDebugActive: boolean
}) {
  return (
    <span className="text-xs font-medium whitespace-nowrap">
      {isDebugActive ? TEXT_CONTENT.DEBUG_PREFIX : ''}
      {TEXT_CONTENT.COLLAPSED_TEXT}
    </span>
  )
})

/**
 * PWAインストールプロンプトコンポーネント
 *
 * @description
 * PWAのインストールを促すDynamic Island風のOrganismコンポーネント。
 * beforeinstallprompt イベントを利用してネイティブプロンプトを表示します。
 *
 * @features
 * - Dynamic Island風のアニメーション
 * - デバッグモード対応
 * - アクセシビリティ対応
 * - TypeScript完全対応
 *
 * @constraints
 * - PWA対応ブラウザでのみ動作
 * - beforeinstallpromptイベントが必要
 * - Service Workerの登録が前提
 *
 * @example
 * ```tsx
 * // 基本的な使用方法
 * <PWAInstallPrompt />
 *
 * // カスタムコールバック付き
 * <PWAInstallPrompt
 *   onInstallSuccess={() => console.log('インストール完了')}
 *   onDismiss={() => console.log('プロンプト閉じる')}
 * />
 *
 * // 自動表示を無効化
 * <PWAInstallPrompt autoShow={false} />
 * ```
 *
 * @debug
 * デバッグモード:
 * 1. Shift+D でグローバルデバッグモードを有効化
 * 2. PWAインストールプロンプトをテスト表示（自動的に表示されます）
 * 3. デバッグメニューからプロンプトの表示/非表示を操作可能
 */
export const PWAInstallPrompt = memo(function PWAInstallPrompt({
  className = '',
  autoShow = true,
  onInstallSuccess,
  onDismiss,
}: PWAInstallPromptProps) {
  const { debugMode } = useDebugStore()
  const promptRef = useRef<HTMLDivElement>(null)
  const checkIfInstalled = useCheckIfInstalled()

  // PWAインストール状態を管理
  const {
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
  } = usePWAInstallState(onInstallSuccess, onDismiss)

  // デバッグイベントリスナーを設定
  useDebugEventListeners(
    setIsDebugActive,
    setShowPrompt,
    setIsVisible,
    setIsExpanded,
  )

  // PWAインストールイベントリスナーを設定
  usePWAInstallEventListeners(
    autoShow,
    debugMode,
    onInstallSuccess,
    setDeferredPrompt,
    setShowPrompt,
    setIsVisible,
    setIsExpanded,
    setIsInstalled,
    checkIfInstalled,
  )

  // デバッグモードが有効になったらプロンプトを表示
  useEffect(() => {
    if (debugMode && !showPrompt && !isInstalled) {
      setIsDebugActive(true)
      setShowPrompt(true)
      setIsVisible(true)
    }
  }, [
    debugMode,
    showPrompt,
    isInstalled,
    setIsDebugActive,
    setShowPrompt,
    setIsVisible,
  ])

  // インストール済みまたは表示しない場合は何も表示しない
  if (isInstalled || !showPrompt || (!deferredPrompt && !isDebugActive)) {
    return null
  }

  return (
    <div className={`${CSS_CLASSES.CONTAINER_BASE} ${className}`}>
      <div
        ref={promptRef}
        onClick={handlePromptClick}
        className={getPromptContainerClassName(
          isDebugActive,
          isVisible,
          isExpanded,
        )}
        style={{
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div className="flex items-center gap-3 relative">
          <InstallIcon isExpanded={isExpanded} />

          {isExpanded ? (
            <ExpandedContent
              isDebugActive={isDebugActive}
              onInstallClick={handleInstallClick}
              onDismiss={handleDismiss}
            />
          ) : (
            <CollapsedContent isDebugActive={isDebugActive} />
          )}
        </div>
      </div>
    </div>
  )
})
