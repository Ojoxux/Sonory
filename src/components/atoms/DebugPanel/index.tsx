/**
 * デバッグ情報表示パネル
 *
 * @description 開発時のデバッグ情報を表示するパネルコンポーネント
 * @example
 * ```tsx
 * <DebugPanel
 *   position={position}
 *   permissionStatus="granted"
 *   currentLighting={lighting}
 *   onTimeChange={(time) => setDebugTime(time)}
 * />
 * ```
 */

'use client'

import type { ReactElement } from 'react'
import { useDebugPanel } from './hooks'
import type { DebugPanelProps } from './types'

export function DebugPanel({
  position,
  permissionStatus,
  currentLighting,
  isMapboxPosition,
  geolocateInitialized,
  geolocateAttempted,
  debugTimeOverride,
  onTimeChange,
  onUpdateLighting,
}: DebugPanelProps): ReactElement {
  const { handleTimeChange, handlePWADebugShow, handlePWADebugHide } =
    useDebugPanel({ onTimeChange, onUpdateLighting })

  return (
    <div className="absolute bottom-30 left-2.5 bg-black/70 text-white p-3 rounded-md text-xs max-w-sm z-[1000]">
      <div className="pointer-events-none mb-3">
        <pre style={{ margin: 0 }}>
          {position
            ? `位置: ${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}
精度: ${position.accuracy.toFixed(1)}m
更新: ${new Date(position.timestamp).toLocaleTimeString()}
権限: ${permissionStatus}
ソース: ${isMapboxPosition ? 'Mapbox (高精度)' : 'カスタム'}
初期化: ${geolocateInitialized ? '完了' : '未完了'}
試行: ${geolocateAttempted ? '完了' : '未完了'}
${
  currentLighting
    ? `
太陽強度: ${(currentLighting.sunIntensity * 100).toFixed(0)}%
影強度: ${(currentLighting.shadowIntensity * 100).toFixed(0)}%
霧密度: ${(currentLighting.fogDensity * 100).toFixed(0)}%`
    : ''
}

現在時間: ${debugTimeOverride !== null ? `${debugTimeOverride}時 (デバッグ)` : `${new Date().getHours()}時 (実時間)`}`
            : '位置情報: 取得中...'}
        </pre>
      </div>

      {/* 時間帯変更ボタン */}
      <div className="pointer-events-auto">
        <div className="text-white text-xs mb-2 font-semibold">時間帯変更:</div>
        <div className="grid grid-cols-2 gap-1 mb-2">
          <button
            onClick={() => handleTimeChange(6)}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              debugTimeOverride === 6
                ? 'bg-orange-500 text-white'
                : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
            }`}
          >
            朝 (6時)
          </button>
          <button
            onClick={() => handleTimeChange(12)}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              debugTimeOverride === 12
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
            }`}
          >
            昼 (12時)
          </button>
          <button
            onClick={() => handleTimeChange(18)}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              debugTimeOverride === 18
                ? 'bg-orange-600 text-white'
                : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
            }`}
          >
            夕方 (18時)
          </button>
          <button
            onClick={() => handleTimeChange(22)}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              debugTimeOverride === 22
                ? 'bg-blue-900 text-white'
                : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
            }`}
          >
            夜 (22時)
          </button>
        </div>
        <button
          onClick={() => handleTimeChange(null)}
          className={`w-full px-2 py-1 rounded text-xs transition-colors ${
            debugTimeOverride === null
              ? 'bg-green-600 text-white'
              : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
          }`}
        >
          実時間に戻す
        </button>
      </div>

      {/* PWAインストールプロンプト操作 */}
      <div className="pointer-events-auto mt-4">
        <div className="text-white text-xs mb-2 font-semibold">
          PWAインストールプロンプト:
        </div>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => handlePWADebugShow(false)}
            className="px-2 py-1 rounded text-xs transition-colors bg-gray-600 hover:bg-gray-500 text-gray-200"
          >
            表示（縮小）
          </button>
          <button
            onClick={() => handlePWADebugShow(true)}
            className="px-2 py-1 rounded text-xs transition-colors bg-gray-600 hover:bg-gray-500 text-gray-200"
          >
            表示（展開）
          </button>
          <button
            onClick={handlePWADebugHide}
            className="col-span-2 px-2 py-1 rounded text-xs transition-colors bg-gray-600 hover:bg-gray-500 text-gray-200"
          >
            非表示
          </button>
        </div>
      </div>

      <div className="pointer-events-none mt-3 text-xs text-gray-300">
        <div>キーボードショートカット:</div>
        <div>Shift+D: デバッグモード切替</div>
        <div>Shift+G: 位置情報再取得</div>
        <div>Shift+R: キャッシュクリア&再取得</div>
      </div>
    </div>
  )
}
