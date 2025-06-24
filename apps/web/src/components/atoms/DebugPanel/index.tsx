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
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaBug, FaChevronDown, FaChevronUp } from 'react-icons/fa'
import { useInferenceStore } from '../../../store/useInferenceStore'
import { useRecorderStore } from '../../../store/useRecorderStore'
import { useDebugPanel, useYAMNetDebug } from './hooks'
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
   const [isExpanded, setIsExpanded] = useState(false)
   const [selectedTab, setSelectedTab] = useState<'main' | 'yamnet'>('main')

   const { handleTimeChange, handlePWADebugShow, handlePWADebugHide } = useDebugPanel({
      onTimeChange,
      onUpdateLighting,
   })

   // YAMNet統合テスト用
   const { results, isInferring, error } = useInferenceStore()
   const { audioData } = useRecorderStore()
   const { performanceData, logs, clearLogs } = useYAMNetDebug()

   /**
    * 録音時間をフォーマット
    */
   const formatRecordedAt = (date: Date): string => {
      return date.toLocaleString('ja-JP', {
         year: 'numeric',
         month: '2-digit',
         day: '2-digit',
         hour: '2-digit',
         minute: '2-digit',
         second: '2-digit',
      })
   }

   return (
      <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         exit={{ opacity: 0, y: 20 }}
         className='absolute bottom-4 right-4 bg-black/70 text-white p-3 rounded-md text-xs max-w-sm z-[1000]'>
         {/* ヘッダー */}
         <div className='flex items-center justify-between mb-3'>
            <div className='flex items-center gap-2'>
               <FaBug className='text-yellow-400' />
               <span className='font-bold'>Debug Panel</span>
            </div>
            <button
               type='button'
               onClick={() => setIsExpanded(!isExpanded)}
               className='p-1 hover:bg-white/10 rounded transition-colors'>
               {isExpanded ? <FaChevronDown /> : <FaChevronUp />}
            </button>
         </div>

         {/* タブ選択（展開時のみ） */}
         {isExpanded && (
            <div className='flex gap-1 mb-3 pointer-events-auto'>
               <button
                  type='button'
                  onClick={() => {
                     console.log('🔧 Mainタブがクリックされました')
                     setSelectedTab('main')
                  }}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                     selectedTab === 'main'
                        ? 'bg-blue-500/50 text-white'
                        : 'hover:bg-white/10 text-gray-300'
                  }`}>
                  Main
               </button>
               <button
                  type='button'
                  onClick={() => {
                     console.log('🔧 YAMNetタブがクリックされました')
                     setSelectedTab('yamnet')
                  }}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                     selectedTab === 'yamnet'
                        ? 'bg-blue-500/50 text-white'
                        : 'hover:bg-white/10 text-gray-300'
                  }`}>
                  YAMNet
               </button>
            </div>
         )}

         {/* メインデバッグ情報（常に表示 or メインタブ） */}
         {(!isExpanded || selectedTab === 'main') && (
            <div className='pointer-events-none mb-3'>
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

現在時間: ${
                          debugTimeOverride !== null
                             ? `${debugTimeOverride}時 (デバッグ)`
                             : `${new Date().getHours()}時 (実時間)`
                       }
時間帯: ${(() => {
                          const hour =
                             debugTimeOverride !== null ? debugTimeOverride : new Date().getHours()
                          if (hour >= 8 && hour < 17) {
                             return '昼 (day)'
                          }
                          if (hour >= 17 && hour < 19) {
                             return '夕方初期 (dusk)'
                          }
                          if (hour >= 19 && hour < 22) {
                             return '夕方後期 (dusk)'
                          }
                          if (hour >= 22 || hour < 4) {
                             return '夜 (night)'
                          }
                          if (hour >= 4 && hour < 6) {
                             return '早朝暗め (night)'
                          }
                          if (hour >= 6 && hour < 8) {
                             return '朝自然 (day)'
                          }
                          return '不明'
                       })()}`
                     : '位置情報: 取得中...'}
               </pre>
            </div>
         )}

         {/* 展開時のコンテンツ */}
         {isExpanded && (
            <>
               {/* メインタブ */}
               {selectedTab === 'main' && (
                  <div className='pointer-events-auto'>
                     {/* 時間帯変更ボタン */}
                     <div className='text-white text-xs mb-2 font-semibold'>時間帯変更:</div>
                     <div className='grid grid-cols-2 gap-1 mb-2'>
                        <button
                           type='button'
                           onClick={() => handleTimeChange(5)}
                           className={`px-2 py-1 rounded text-xs transition-colors ${
                              debugTimeOverride === 5
                                 ? 'bg-indigo-600 text-white'
                                 : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                           }`}>
                           早朝暗め (5時)
                        </button>
                        <button
                           type='button'
                           onClick={() => handleTimeChange(7)}
                           className={`px-2 py-1 rounded text-xs transition-colors ${
                              debugTimeOverride === 7
                                 ? 'bg-blue-400 text-white'
                                 : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                           }`}>
                           朝自然 (7時)
                        </button>
                        <button
                           type='button'
                           onClick={() => handleTimeChange(12)}
                           className={`px-2 py-1 rounded text-xs transition-colors ${
                              debugTimeOverride === 12
                                 ? 'bg-yellow-500 text-white'
                                 : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                           }`}>
                           昼 (12時)
                        </button>
                        <button
                           type='button'
                           onClick={() => handleTimeChange(17)}
                           className={`px-2 py-1 rounded text-xs transition-colors ${
                              debugTimeOverride === 17
                                 ? 'bg-orange-600 text-white'
                                 : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                           }`}>
                           夕方初期 (17時)
                        </button>
                        <button
                           type='button'
                           onClick={() => handleTimeChange(20)}
                           className={`px-2 py-1 rounded text-xs transition-colors ${
                              debugTimeOverride === 20
                                 ? 'bg-red-600 text-white'
                                 : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                           }`}>
                           夕方後期 (20時)
                        </button>
                     </div>
                     <div className='grid grid-cols-2 gap-1 mb-2'>
                        <button
                           type='button'
                           onClick={() => handleTimeChange(22)}
                           className={`px-2 py-1 rounded text-xs transition-colors ${
                              debugTimeOverride === 22
                                 ? 'bg-blue-900 text-white'
                                 : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                           }`}>
                           夜 (22時)
                        </button>
                        <button
                           type='button'
                           onClick={() => handleTimeChange(2)}
                           className={`px-2 py-1 rounded text-xs transition-colors ${
                              debugTimeOverride === 2
                                 ? 'bg-indigo-900 text-white'
                                 : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                           }`}>
                           深夜 (2時)
                        </button>
                     </div>
                     <button
                        type='button'
                        onClick={() => handleTimeChange(null)}
                        className={`w-full px-2 py-1 rounded text-xs transition-colors ${
                           debugTimeOverride === null
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                        }`}>
                        実時間に戻す
                     </button>

                     {/* PWAインストールプロンプト操作 */}
                     <div className='mt-4'>
                        <div className='text-white text-xs mb-2 font-semibold'>
                           PWAインストールプロンプト:
                        </div>
                        <div className='grid grid-cols-2 gap-1'>
                           <button
                              type='button'
                              onClick={() => handlePWADebugShow(false)}
                              className='px-2 py-1 rounded text-xs transition-colors bg-gray-600 hover:bg-gray-500 text-gray-200'>
                              表示（縮小）
                           </button>
                           <button
                              type='button'
                              onClick={() => handlePWADebugShow(true)}
                              className='px-2 py-1 rounded text-xs transition-colors bg-gray-600 hover:bg-gray-500 text-gray-200'>
                              表示（展開）
                           </button>
                           <button
                              type='button'
                              onClick={handlePWADebugHide}
                              className='col-span-2 px-2 py-1 rounded text-xs transition-colors bg-gray-600 hover:bg-gray-500 text-gray-200'>
                              非表示
                           </button>
                        </div>
                     </div>

                     <div className='pointer-events-none mt-3 text-xs text-gray-300'>
                        <div>キーボードショートカット:</div>
                        <div>Shift+D: デバッグモード切替</div>
                        <div>Shift+G: 位置情報再取得</div>
                        <div>Shift+R: キャッシュクリア&再取得</div>
                     </div>
                  </div>
               )}

               {/* YAMNetタブ */}
               {selectedTab === 'yamnet' && (
                  <div className='space-y-2 max-h-80 overflow-y-auto pointer-events-auto'>
                     {/* 現在の状態デバッグ */}
                     <div className='bg-yellow-500/20 p-2 rounded border border-yellow-500/30'>
                        <div className='text-yellow-300 text-xs font-bold'>Debug Info</div>
                        <div className='text-yellow-200 text-xs'>
                           Selected Tab: {selectedTab} | Expanded: {isExpanded ? 'Yes' : 'No'}
                        </div>
                     </div>

                     {/* 録音・AI状態 */}
                     <div className='grid grid-cols-2 gap-2'>
                        <div className='bg-white/5 p-2 rounded'>
                           <div className='text-gray-400'>AI Analysis</div>
                           <div className={isInferring ? 'text-yellow-400' : 'text-green-400'}>
                              {isInferring ? 'Running' : 'Idle'}
                           </div>
                        </div>
                        <div className='bg-white/5 p-2 rounded'>
                           <div className='text-gray-400'>Results Count</div>
                           <div>{results.length}</div>
                        </div>
                     </div>

                     <div className='bg-white/5 p-2 rounded'>
                        <div className='text-gray-400'>Audio Data</div>
                        <div>
                           {audioData
                              ? `${audioData.id.substring(0, 8)}... (${formatRecordedAt(
                                   audioData.recordedAt
                                )})`
                              : 'None'}
                        </div>
                     </div>

                     {/* パフォーマンス */}
                     <div className='bg-white/5 p-2 rounded'>
                        <div className='text-gray-400'>Memory Usage</div>
                        <div>{performanceData.memoryUsage}MB</div>
                     </div>
                     <div className='bg-white/5 p-2 rounded'>
                        <div className='text-gray-400'>Last AI Processing</div>
                        <div>{performanceData.lastAIProcessingTime}ms</div>
                     </div>

                     {/* エラー表示 */}
                     {error && (
                        <div className='bg-red-500/20 p-2 rounded border border-red-500/30'>
                           <div className='text-red-400'>Error</div>
                           <div className='text-red-300 text-xs'>{error.message}</div>
                        </div>
                     )}

                     {/* 結果表示 */}
                     {results.length > 0 && (
                        <div className='bg-white/5 p-2 rounded'>
                           <div className='text-gray-400 mb-1'>Latest Results</div>
                           {results.slice(0, 3).map((result, index) => (
                              <div key={`${result.label}-${index}`} className='text-xs'>
                                 {result.label}: {Math.round(result.confidence * 100)}%
                              </div>
                           ))}
                        </div>
                     )}

                     {/* ログ */}
                     <div className='bg-white/5 p-2 rounded'>
                        <div className='flex justify-between items-center mb-1'>
                           <span className='text-gray-400'>Recent Logs</span>
                           <button
                              type='button'
                              onClick={clearLogs}
                              className='text-xs px-1 py-0.5 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 transition-colors'>
                              Clear
                           </button>
                        </div>
                        <div className='space-y-1 max-h-32 overflow-y-auto'>
                           {logs.slice(0, 5).map(log => (
                              <div key={log.id} className='text-xs'>
                                 <span className='text-gray-500'>{log.timestamp}</span>:{' '}
                                 {log.message}
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* テストボタン */}
                     <button
                        type='button'
                        onClick={() => {
                           console.log('🧪 YAMNetテストボタンがクリックされました')
                           alert('YAMNet Test Button Clicked!')
                        }}
                        className='w-full bg-blue-500/20 text-blue-300 p-2 rounded hover:bg-blue-500/30 transition-colors'>
                        Test YAMNet Button
                     </button>
                  </div>
               )}
            </>
         )}
      </motion.div>
   )
}
