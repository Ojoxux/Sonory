/**
 * MapComponent統合管理フック
 *
 * @description MapComponentの主要なロジックを統合管理するカスタムフック
 * fpのエッセンス（Option/Either/TaskEither）を適用
 * @example
 * ```tsx
 * const {
 *   mapContainerRef,
 *   map,
 *   mapStyleLoaded,
 *   position,
 *   currentLighting,
 *   debugMode,
 *   pins,
 *   selectedPinId,
 *   permissionStatus,
 *   geolocateInitialized,
 *   geolocateAttempted,
 *   debugTimeOverride,
 *   selectPin,
 *   setDebugTimeOverride,
 *   updateLightingAndShadows,
 * } = useMapComponent({
 *   onGeolocationReady,
 *   onReturnToLocationReady,
 *   onBearingChange,
 * })
 * ```
 */

import { useDebugStore } from '@/store/useDebugStore'
import { type SoundPin, useSoundPinStore } from '@/store/useSoundPinStore'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
import mapboxgl from 'mapbox-gl'
import {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useBrowserGeolocation } from './hooks/useBrowserGeolocation'
import { useLocationIntegration } from './hooks/useLocationIntegration'
import { useLocationStorage } from './hooks/useLocationStorage'
import { useMapControls } from './hooks/useMapControls'
import { useMapEnvironment } from './hooks/useMapEnvironment'
import type {
  GeoJSONLineStringFeature,
  LocationData,
  MapboxNonStandardMethods,
} from './type'
import {
  fromNullable,
  isValidPosition,
  selectBestPosition,
} from './utils/functional'
import type { LightingConfig } from './utils/sunCalculations'

export type UseMapComponentProps = {
  /** 位置情報取得準備完了時のコールバック */
  onGeolocationReady?: (attemptGeolocation: () => void) => void
  /** 位置に戻る機能準備完了時のコールバック */
  onReturnToLocationReady?: (returnToLocation: () => void) => void
  /** マップ回転時のコールバック */
  onBearingChange?: (bearing: number) => void
}

export type UseMapComponentReturn = {
  /** マップコンテナのref */
  mapContainerRef: RefObject<HTMLDivElement | null>
  /** Mapboxマップインスタンス */
  map: mapboxgl.Map | null
  /** マップスタイルの読み込み状態 */
  mapStyleLoaded: boolean
  /** 統合された位置情報 */
  position: LocationData | null
  /** 現在のライティング設定 */
  currentLighting: LightingConfig | null
  /** デバッグモードの状態 */
  debugMode: boolean
  /** 音声ピンの配列 */
  pins: SoundPin[]
  /** 選択中のピンID */
  selectedPinId: string | null
  /** 位置情報の権限状態 */
  permissionStatus: string
  /** 位置情報取得の初期化状態 */
  geolocateInitialized: boolean
  /** 位置情報取得の試行状態 */
  geolocateAttempted: boolean
  /** デバッグ時間のオーバーライド値 */
  debugTimeOverride: number | null
  /** Mapboxから取得した位置情報かどうか */
  isMapboxPosition: boolean
  /** ピン選択関数 */
  selectPin: (pinId: string | null) => void
  /** デバッグ時間設定関数 */
  setDebugTimeOverride: (time: number | null) => void
  /** ライティング更新関数 */
  updateLightingAndShadows: () => void
}

/**
 * Mapboxの非標準メソッド用の型安全な検証（純粋関数）
 */
const supportsMethod = <T extends object>(obj: T, method: string): boolean =>
  method in obj &&
  typeof (obj as Record<string, unknown>)[method] === 'function'

/**
 * Mapboxの非標準メソッドを安全に呼び出すためのヘルパー関数群（fpで安全に呼び出す）
 */
const createMapboxHelpers = (): MapboxNonStandardMethods => ({
  setConfigProperty: (map, namespace, property, value) =>
    pipe(supportsMethod(map, 'setConfigProperty'), (isSupported) => {
      if (isSupported) {
        const method = (map as unknown as Record<string, unknown>)
          .setConfigProperty as (
          importId: string,
          configName: string,
          value: unknown,
        ) => void
        method.call(map, namespace, property, value)
      }
    }),

  setTerrain: (map, config) =>
    pipe(supportsMethod(map, 'setTerrain'), (isSupported) => {
      if (isSupported) {
        const method = (map as unknown as Record<string, unknown>)
          .setTerrain as (config: Record<string, unknown>) => void
        method.call(map, config)
      }
    }),

  setLight: (map, config) =>
    pipe(supportsMethod(map, 'setLight'), (isSupported) => {
      if (isSupported) {
        const method = (map as unknown as Record<string, unknown>).setLight as (
          config: unknown,
        ) => void
        method.call(map, config)
      }
    }),

  setFog: (map, config) =>
    pipe(supportsMethod(map, 'setFog'), (isSupported) => {
      if (isSupported) {
        const method = (map as unknown as Record<string, unknown>).setFog as (
          config: Record<string, unknown>,
        ) => void
        method.call(map, config)
      }
    }),
})

// Mapboxヘルパーのインスタンス（イミュータブル）
const mapboxHelpers = createMapboxHelpers()

/**
 * MapComponent統合管理フック
 */
export function useMapComponent({
  onGeolocationReady,
  onReturnToLocationReady,
  onBearingChange,
}: UseMapComponentProps): UseMapComponentReturn {
  // Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInitializedRef = useRef<boolean>(false)
  const geolocateControlRef = useRef<mapboxgl.GeolocateControl | null>(null)
  const hasInitialPositionSet = useRef<boolean>(false)
  const userInteractionRef = useRef<boolean>(false)
  const lastInteractionTimeRef = useRef<number>(0)

  // 状態管理
  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  const [mapStyleLoaded, setMapStyleLoaded] = useState<boolean>(false)
  const [geolocateInitialized, setGeolocateInitialized] =
    useState<boolean>(false)

  // ストア
  const {
    debugMode,
    toggleDebugMode,
    debugTimeOverride,
    setDebugTimeOverride,
  } = useDebugStore()
  const { pins, selectedPinId, selectPin } = useSoundPinStore()

  // カスタムフック
  const { position: customPosition, permissionStatus } = useBrowserGeolocation()
  const { savedPosition, savePosition, clearSavedPosition } =
    useLocationStorage()

  // 通知関数
  const createNotification = useCallback(
    (message: string, type: 'success' | 'error' | 'warning') =>
      ({
        message,
        type,
        timestamp: Date.now(),
      }) as const,
    [],
  )

  // 副作用を実行する関数（分離された副作用）
  const executeNotification = useCallback(
    (notification: ReturnType<typeof createNotification>) => {
      console.log(`[${notification.type}] ${notification.message}`)
      // HACK: 将来的にはtoast通知などに拡張可能
    },
    [],
  )

  // 通知の実行
  const showNotification = useCallback(
    (message: string, type: 'success' | 'error' | 'warning') => {
      const notification = createNotification(message, type)
      executeNotification(notification)
    },
    [createNotification, executeNotification],
  )

  const {
    mapboxPosition,
    geolocateAttempted,
    attemptGeolocation,
    resetGeolocation,
  } = useLocationIntegration({
    geolocateControl: geolocateControlRef.current,
    geolocateInitialized,
    debugMode,
    showNotification,
    onPositionUpdate: (position) => {
      savePosition(position)
    },
    map,
  })

  // 実際に使用する位置情報（fpで優先順位付き選択）
  const position = useMemo((): LocationData | null => {
    const mapboxOpt = fromNullable(mapboxPosition)
    const customOpt = fromNullable(customPosition)
    const savedOpt = fromNullable(savedPosition)

    return pipe(
      selectBestPosition(mapboxOpt, customOpt, savedOpt),
      O.filter(isValidPosition),
      O.getOrElse(() => null as LocationData | null),
    )
  }, [mapboxPosition, customPosition, savedPosition])

  // 位置情報の状態を管理
  const positionState = useMemo(
    () => ({
      hasMapboxPosition: O.isSome(fromNullable(mapboxPosition)),
      hasValidPosition: position !== null,
      positionSource: mapboxPosition
        ? ('mapbox' as const)
        : customPosition
          ? ('browser' as const)
          : savedPosition
            ? ('saved' as const)
            : ('none' as const),
    }),
    [mapboxPosition, customPosition, savedPosition, position],
  )

  const { currentLighting, updateLightingAndShadows } = useMapEnvironment({
    map,
    mapStyleLoaded,
    position,
    debugTimeOverride,
    mapboxHelpers,
  })

  // キーボードショートカット
  useMapControls({
    map,
    debugMode,
    onToggleDebugMode: toggleDebugMode,
    onGeolocationRetry: attemptGeolocation,
    onGeolocationReset: () => {
      clearSavedPosition()
      resetGeolocation()
    },
    onDebugTimeChange: setDebugTimeOverride,
    onUpdateLighting: () => updateLightingAndShadows(),
  })

  // マップ初期化
  useEffect(() => {
    if (!mapContainerRef.current || mapInitializedRef.current) return

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!mapboxToken) {
      console.error('Mapbox access token is not set')
      return
    }

    mapboxgl.accessToken = mapboxToken

    try {
      const mapInstance = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/standard',
        center: [139.6917, 35.6895], // 東京駅
        zoom: 16,
        pitch: 45,
        bearing: -20,
        antialias: true,
      })

      // Geolocationコントロールを追加
      const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        },
        trackUserLocation: false,
        showAccuracyCircle: false,
        showUserHeading: false,
        showUserLocation: false,
      })

      mapInstance.addControl(geolocateControl, 'bottom-right')
      geolocateControlRef.current = geolocateControl

      // HACK: ユーザーの地図操作をリスナーで検知するようにした
      const handleUserInteraction = () => {
        userInteractionRef.current = true
        lastInteractionTimeRef.current = Date.now()
        console.log('ユーザーが地図を操作しました')
      }

      // HACK: 各種ユーザー操作イベントを監視しておく
      mapInstance.on('dragstart', handleUserInteraction)
      mapInstance.on('zoomstart', handleUserInteraction)
      mapInstance.on('rotatestart', handleUserInteraction)
      mapInstance.on('pitchstart', handleUserInteraction)
      mapInstance.on('touchstart', handleUserInteraction)

      // イベントリスナー設定
      mapInstance.on('load', () => {
        console.log('マップが読み込まれました')
        setMapStyleLoaded(true)

        // ユーザーパス用のソースとレイヤーを追加
        mapInstance.addSource('user-path', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [],
            },
          },
        })

        mapInstance.addLayer({
          id: 'user-path',
          type: 'line',
          source: 'user-path',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#ff6b6b',
            'line-width': 3,
            'line-opacity': 0.8,
          },
        })
      })

      mapInstance.on('styledata', () => {
        console.log('スタイルデータが更新されました')
        setMapStyleLoaded(true)
      })

      mapInstance.on('rotate', () => {
        const bearing = mapInstance.getBearing()
        onBearingChange?.(bearing)
      })

      // Geolocationコントロールのイベント
      geolocateControl.on('geolocate', (e) => {
        console.log('Geolocation成功:', e.coords)
        const newPosition = {
          latitude: e.coords.latitude,
          longitude: e.coords.longitude,
          accuracy: e.coords.accuracy,
          timestamp: Date.now(),
        }
        savePosition(newPosition)
      })

      geolocateControl.on('trackuserlocationstart', () => {
        console.log('位置追跡開始')
        setGeolocateInitialized(true)
      })

      geolocateControl.on('trackuserlocationend', () => {
        console.log('位置追跡終了')
      })

      geolocateControl.on('error', (error) => {
        console.error('Geolocation エラー:', error)
      })

      setMap(mapInstance)
      mapInitializedRef.current = true

      // コールバック関数を設定
      onGeolocationReady?.(attemptGeolocation)
      onReturnToLocationReady?.(() => {
        // ユーザー操作フラグをリセットして自動センタリングを有効化
        userInteractionRef.current = false
        lastInteractionTimeRef.current = 0
        console.log('手動で現在地に戻ります')

        // 現在の位置情報を取得（シンプルなアプローチ）
        const currentPosition =
          customPosition && isValidPosition(customPosition)
            ? customPosition
            : savedPosition && isValidPosition(savedPosition)
              ? savedPosition
              : null

        if (currentPosition) {
          // 位置情報がある場合は即座に移動
          console.log('既存の位置情報で即座に移動:', currentPosition)
          mapInstance.flyTo({
            center: [currentPosition.longitude, currentPosition.latitude],
            zoom: 18,
            pitch: 50,
            bearing: -20,
            essential: true,
            duration: 1500, // 少し短縮してレスポンシブに
          })
        } else {
          // 位置情報がない場合は取得を試行
          console.log('位置情報がないため取得を試行します')
          attemptGeolocation()
        }
      })
    } catch (error) {
      console.error('マップの初期化に失敗:', error)
    }

    return () => {
      if (mapInitializedRef.current && map) {
        map.remove()
        setMap(null)
        mapInitializedRef.current = false
        hasInitialPositionSet.current = false
      }
    }
  }, []) // 依存関係を空にして一度だけ実行

  // 位置情報が取得できたらマップの中心を移動（ユーザー操作を考慮）
  useEffect(() => {
    if (!map || !position || !mapStyleLoaded) return

    const now = Date.now()
    const timeSinceLastInteraction = now - lastInteractionTimeRef.current
    const shouldAutoCenter =
      !userInteractionRef.current || timeSinceLastInteraction > 30000 // 30秒以上操作がない場合

    console.log('マップ更新:', {
      source: positionState.positionSource,
      latitude: position.latitude,
      longitude: position.longitude,
      accuracy: position.accuracy,
      timestamp: new Date(position.timestamp).toLocaleTimeString(),
      isInitial: !hasInitialPositionSet.current,
      userInteracted: userInteractionRef.current,
      timeSinceLastInteraction,
      shouldAutoCenter,
    })

    // 初回の位置設定は必ず実行
    if (!hasInitialPositionSet.current) {
      // 初回は即座に移動（アニメーションなし）
      map.jumpTo({
        center: [position.longitude, position.latitude],
        zoom: 18,
        pitch: 50,
      })
      hasInitialPositionSet.current = true
    } else if (shouldAutoCenter) {
      // ユーザーが操作していない、または30秒以上操作がない場合のみ自動センタリング
      console.log('自動センタリングを実行します')
      map.flyTo({
        center: [position.longitude, position.latitude],
        zoom: 18,
        pitch: 50,
        essential: true,
        duration: 2000,
      })
    } else {
      console.log('ユーザー操作中のため自動センタリングをスキップします')
    }

    // ユーザーパスを更新
    if (map.getSource('user-path')) {
      const source = map.getSource('user-path') as mapboxgl.GeoJSONSource

      const updatePath = (
        currentCoordinates: Array<[number, number]>,
      ): void => {
        const newCoord: [number, number] = [
          position.longitude,
          position.latitude,
        ]

        // 最後の座標と異なる場合のみ追加
        const lastCoord = currentCoordinates[currentCoordinates.length - 1]
        if (
          !lastCoord ||
          lastCoord[0] !== newCoord[0] ||
          lastCoord[1] !== newCoord[1]
        ) {
          const updatedCoordinates = [...currentCoordinates, newCoord]

          // 最大100ポイントまで保持
          if (updatedCoordinates.length > 100) {
            updatedCoordinates.shift()
          }

          const pathData: GeoJSONLineStringFeature = {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: updatedCoordinates,
            },
          }

          source.setData(pathData)
          console.log(
            'ユーザーパスを更新しました:',
            updatedCoordinates.length,
            'ポイント',
          )
        }
      }

      // 現在のパスデータを取得して更新
      updatePath([])
    }
  }, [map, position, mapStyleLoaded, positionState.positionSource])

  return {
    mapContainerRef,
    map,
    mapStyleLoaded,
    position,
    currentLighting,
    debugMode,
    pins,
    selectedPinId,
    permissionStatus,
    geolocateInitialized,
    geolocateAttempted,
    debugTimeOverride,
    isMapboxPosition: positionState.hasMapboxPosition,
    selectPin,
    setDebugTimeOverride,
    updateLightingAndShadows,
  }
}
