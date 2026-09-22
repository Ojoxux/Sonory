"use client"

import { AppHeader } from "@/components/molecules/AppHeader"
import { AppInfoSheet } from "@/components/organisms/AppInfoSheet"
import { PWAInstallPrompt } from "@/components/organisms/PWAInstallPrompt"
import { RecordingInterface } from "@/components/organisms/RecordingInterface"
import { SettingsSheet } from "@/components/organisms/SettingsSheet"
import type { UIOverlayProps } from "./types"

/**
 * UIオーバーレイコンポーネント
 *
 * @description
 * マップ上に表示されるUI要素を統合するOrganismコンポーネント
 * ヘッダー、設定シート、アプリ情報シート、PWAインストールプロンプト、
 * 録音インターフェースを含む
 *
 * @example
 * ```tsx
 * <UIOverlay
 *   onSettingsClick={() => console.log('設定')}
 *   latitude={37.1234}
 *   longitude={139.1234}
 * />
 * ```
 */
export function UIOverlay({
   onSettingsClick,
   onAppInfoClick,
   onCompassClick,
   latitude,
   longitude,
   debugTimeOverride,
   mapBearing,
   isSettingsOpen,
   onSettingsClose,
   isAppInfoOpen,
   onAppInfoClose,
}: UIOverlayProps) {
   return (
      <>
         {/* ヘッダー（常に表示） */}
         <AppHeader
            onSettingsClick={onSettingsClick}
            onAppInfoClick={onAppInfoClick}
            onCompassClick={onCompassClick}
            latitude={latitude}
            longitude={longitude}
            debugTimeOverride={debugTimeOverride}
            mapBearing={mapBearing}
         />

         {/* 設定シート */}
         <SettingsSheet isOpen={isSettingsOpen} onClose={onSettingsClose} />

         {/* アプリ情報シート */}
         <AppInfoSheet isOpen={isAppInfoOpen} onClose={onAppInfoClose} />

         {/* PWAインストールプロンプト */}
         <PWAInstallPrompt />

         {/* 録音インターフェース */}
         <RecordingInterface
            onExpandedChange={() => {
               /* no-op */
            }}
            currentPosition={
               latitude !== undefined && longitude !== undefined
                  ? { latitude, longitude }
                  : null
            }
         />
      </>
   )
}
