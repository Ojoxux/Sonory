'use client'

import mapboxgl from 'mapbox-gl'
import {
  type ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useGeolocation } from './hooks/useGeolocation'
import {
  applyNightLighting,
  get3DTerrainConfig,
  getAtmosphereConfig,
  terrainSource,
} from './styles/mapStyles'
import type {
  GeoJSONLineStringFeature,
  LocationData,
  MapboxLightConfig,
  MapboxNonStandardMethods,
} from './type'
import {
  type LightingConfig,
  type WeatherEffects,
  applyWeatherEffects,
  calculateSunPosition,
  defaultWeather,
  getLightingConfig,
} from './utils/sunCalculations'

/**
 * Mapboxの非標準メソッド用の型検証ヘルパー関数
 *
 * @param obj - 検証対象のオブジェクト
 * @param method - 存在を確認するメソッド名
 * @returns メソッドが存在し関数である場合はtrue
 */
function supportsMethod<T extends object>(obj: T, method: string): boolean {
  return (
    method in obj &&
    typeof (obj as Record<string, unknown>)[method] === 'function'
  )
}

/**
 * Mapboxの非標準メソッドを安全に呼び出すためのヘルパー関数群
 */
const mapboxHelpers: MapboxNonStandardMethods = {
  setConfigProperty: (map, namespace, property, value) => {
    if (supportsMethod(map, 'setConfigProperty')) {
      const method = (map as unknown as Record<string, unknown>)
        .setConfigProperty as (
        importId: string,
        configName: string,
        value: unknown,
      ) => void
      method.call(map, namespace, property, value)
    }
  },
  setTerrain: (map, config) => {
    if (supportsMethod(map, 'setTerrain')) {
      const method = (map as unknown as Record<string, unknown>).setTerrain as (
        config: Record<string, unknown>,
      ) => void
      method.call(map, config)
    }
  },
  setLight: (map, config) => {
    if (supportsMethod(map, 'setLight')) {
      const method = (map as unknown as Record<string, unknown>).setLight as (
        config: MapboxLightConfig,
      ) => void
      method.call(map, config)
    }
  },
  setFog: (map, config) => {
    if (supportsMethod(map, 'setFog')) {
      const method = (map as unknown as Record<string, unknown>).setFog as (
        config: Record<string, unknown>,
      ) => void
      method.call(map, config)
    }
  },
}

/**
 * Mapbox GLを使用したマップコンポーネント
 *
 * Zenlyスタイルのシンプルな地図表示と、時間帯に応じた色変化を提供
 * 3D建物表示機能を含む
 */
export function MapComponent(): ReactElement {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInitializedRef = useRef<boolean>(false)

  // 簡易的な通知関数
  const showNotification = useCallback(
    (message: string, type: 'success' | 'error' | 'warning') => {
      console.log(`[${type}] ${message}`)
      // ここに通知UIのロジックを入れることもできます
    },
    [],
  )

  // カスタムフックの位置情報も取得するが、Mapboxの内蔵機能を優先する
  const { position: customPosition, permissionStatus } = useGeolocation()

  // Mapboxのgeolocationコントロールから得た位置情報
  const [mapboxPosition, setMapboxPosition] = useState<LocationData | null>(
    null,
  )
  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  const [mapStyleLoaded, setMapStyleLoaded] = useState<boolean>(false)
  const [debugMode, setDebugMode] = useState<boolean>(false)
  const [geolocateInitialized, setGeolocateInitialized] =
    useState<boolean>(false)
  const [geolocateAttempted, setGeolocateAttempted] = useState<boolean>(false)
  const [currentLighting, setCurrentLighting] = useState<LightingConfig | null>(
    null,
  )
  const [currentWeather] = useState<WeatherEffects>(defaultWeather)

  // 実際に使用する位置情報（Mapboxの位置情報を優先）
  const position = mapboxPosition || customPosition
  const geolocateControlRef = useRef<mapboxgl.GeolocateControl | null>(null)
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const hasInitialPositionSet = useRef<boolean>(false)

  // 保存された位置情報をローカルストレージから取得
  useEffect(() => {
    try {
      const savedPosition = localStorage.getItem('sonory_last_position')
      if (savedPosition) {
        const parsedPosition = JSON.parse(savedPosition) as LocationData
        // 24時間以内の位置情報のみ使用
        const isRecent =
          Date.now() - parsedPosition.timestamp < 24 * 60 * 60 * 1000

        if (isRecent) {
          console.log('保存された位置情報を読み込みました:', parsedPosition)
          setMapboxPosition(parsedPosition)
          // 保存された位置情報がある場合は初期位置設定済みとする
          hasInitialPositionSet.current = true
        } else {
          console.log('保存された位置情報が古いため使用しません')
          localStorage.removeItem('sonory_last_position')
        }
      }
    } catch (error) {
      console.error('保存された位置情報の読み込みに失敗:', error)
    }
  }, [])

  // 位置情報が更新されたらローカルストレージに保存
  useEffect(() => {
    if (position) {
      try {
        localStorage.setItem('sonory_last_position', JSON.stringify(position))
        console.log('位置情報をローカルストレージに保存しました')
      } catch (error) {
        console.error('位置情報の保存に失敗:', error)
      }
    }
  }, [position])

  // 位置情報取得を試みる関数
  const attemptGeolocation = useCallback(() => {
    if (!geolocateControlRef.current || !geolocateInitialized) return

    setGeolocateAttempted(true)
    console.log('位置情報の取得を試みます...')

    try {
      geolocateControlRef.current.trigger()
    } catch (error) {
      console.error('位置情報取得の試行に失敗:', error)

      // エラーが発生した場合はカスタム位置情報を使用
      if (customPosition) {
        console.log('カスタム位置情報を使用します')
        setMapboxPosition(null) // mapboxPositionをクリアしてcustomPositionが使われるようにする
      } else {
        // 位置情報が取得できない場合はユーザーに通知
        showNotification('位置情報を取得できません', 'warning')
      }
    }
  }, [geolocateInitialized]) // 依存関係を最小限に

  // マップの初期化（一度だけ実行）
  useEffect(() => {
    if (!mapContainerRef.current || map || mapInitializedRef.current) return // 既にマップが存在する場合は何もしない

    // StrictModeでの二重実行を防ぐためのチェック
    const container = mapContainerRef.current
    if (container.hasChildNodes()) {
      console.log('マップは既に初期化されています')
      return
    }

    // 初期化フラグを立てる
    mapInitializedRef.current = true
    console.log('マップを初期化します')

    // Mapbox認証トークン設定
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

    // デバッグモードのキーボードショートカット設定
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift + D でデバッグモード切り替え
      if (e.shiftKey && e.key === 'D') {
        setDebugMode((prev) => !prev)
      }

      // Shift + G で位置情報を再取得
      if (e.shiftKey && e.key === 'G') {
        attemptGeolocation()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    // 初期位置を決定（保存された位置 > カスタム位置 > デフォルト（東京））
    let initialCenter: [number, number] = [139.6917, 35.6895] // デフォルトは東京
    let initialZoom = 17.5 // より近いズームレベル（以前: 15.1）
    let initialPitch = 60 // 少し低めのピッチ角度（以前: 62）

    // 保存された位置情報があればそれを使用
    const savedPosition = localStorage.getItem('sonory_last_position')
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition) as LocationData
        const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000
        if (isRecent) {
          initialCenter = [parsed.longitude, parsed.latitude]
          initialZoom = 18 // より近いズームレベル（以前: 16）
          initialPitch = 50 // より低めのピッチ角度（以前: 45）
        }
      } catch (error) {
        console.error('保存された位置情報の解析に失敗:', error)
      }
    } else if (customPosition) {
      // カスタム位置情報があればそれを使用
      initialCenter = [customPosition.longitude, customPosition.latitude]
      initialZoom = 18 // より近いズームレベル（以前: 16）
      initialPitch = 50 // より低めのピッチ角度（以前: 45）
    }

    // Mapbox Standard Styleを使用した美しいマップ設定
    const mapInstance = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/standard',
      center: initialCenter,
      zoom: initialZoom,
      pitch: initialPitch,
      bearing: -20,
      antialias: true,
      attributionControl: true,
      logoPosition: 'bottom-left',
      maxPitch: 85,
      renderWorldCopies: false,
    })

    // スタイル読み込み完了時のイベント
    mapInstance.on('style.load', () => {
      setMapStyleLoaded(true)

      // Mapbox Standard Styleの設定
      // 時間帯に応じたライトプリセットを設定
      const hour = new Date().getHours()
      let lightPreset = 'day'
      if (hour >= 5 && hour < 8) {
        lightPreset = 'dawn'
      } else if (hour >= 17 && hour < 19) {
        lightPreset = 'dusk'
      } else if (hour >= 19 || hour < 5) {
        lightPreset = 'night'
      }

      // Standard Styleの設定を適用
      try {
        mapboxHelpers.setConfigProperty(
          mapInstance,
          'basemap',
          'lightPreset',
          lightPreset,
        )
        mapboxHelpers.setConfigProperty(
          mapInstance,
          'basemap',
          'showPlaceLabels',
          true,
        )
        mapboxHelpers.setConfigProperty(
          mapInstance,
          'basemap',
          'showPointOfInterestLabels',
          true,
        )
        mapboxHelpers.setConfigProperty(
          mapInstance,
          'basemap',
          'showRoadLabels',
          true,
        )
        mapboxHelpers.setConfigProperty(
          mapInstance,
          'basemap',
          'showTransitLabels',
          true,
        )
      } catch (error) {
        console.error('Standard Style設定エラー:', error)
      }

      // 地形データソースを追加
      if (!mapInstance.getSource('mapbox-dem')) {
        mapInstance.addSource('mapbox-dem', terrainSource)
      }

      // 3D地形を有効化
      try {
        mapboxHelpers.setTerrain(mapInstance, get3DTerrainConfig())
      } catch (error) {
        console.error('3D地形の設定エラー:', error)
      }

      // リアルタイムの光と影の設定を適用
      updateLightingAndShadows(mapInstance)

      // 発光するラインの例（位置情報の軌跡などに使用可能）
      if (position) {
        const initialFeature: GeoJSONLineStringFeature = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [[position.longitude, position.latitude]],
          },
        }

        mapInstance.addSource('user-path', {
          type: 'geojson',
          lineMetrics: true,
          data: initialFeature,
        })

        mapInstance.addLayer({
          id: 'user-path',
          source: 'user-path',
          type: 'line',
          paint: {
            'line-width': 8,
            'line-emissive-strength': 0.8,
            'line-gradient': [
              'interpolate',
              ['linear'],
              ['line-progress'],
              0,
              '#ff6b6b',
              0.5,
              '#4ecdc4',
              1,
              '#45b7d1',
            ],
          },
        })
      }

      // マップの傾きを制御できるようにする
      mapInstance.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'bottom-right',
      )

      // 現在地コントロールを追加（タイムアウトエラーを防ぐ設定）
      const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: false, // 高精度を無効にしてタイムアウトを防ぐ
          timeout: Infinity, // タイムアウトを無効化
          maximumAge: 300000, // 5分以内のキャッシュを許可
        },
        trackUserLocation: true,
        showUserHeading: true,
        showAccuracyCircle: false, // カスタムマーカーを使用するため精度円は非表示
        fitBoundsOptions: {
          maxZoom: 16, // 最大ズームレベルを制限
        },
      })

      mapInstance.addControl(geolocateControl, 'bottom-right')
      geolocateControlRef.current = geolocateControl

      // 位置情報が取得されたときのイベント
      geolocateControl.on('geolocate', (e) => {
        const { latitude, longitude, accuracy } = e.coords
        console.log('位置情報を取得:', {
          lat: latitude,
          lng: longitude,
          acc: accuracy,
          timestamp: Date.now(),
        })

        // 位置情報を保存
        const newPosition = {
          latitude,
          longitude,
          accuracy,
          timestamp: Date.now(),
        }

        setMapboxPosition(newPosition)

        // 通知
        showNotification('位置情報を更新しました', 'success')
      })

      // エラー発生時のイベント
      geolocateControl.on('error', (err: unknown) => {
        if (err && typeof err === 'object' && 'code' in err) {
          const geolocationError = err as GeolocationPositionError

          // タイムアウトエラーの場合は静かに処理（通知しない）
          if (geolocationError.code === 3) {
            // タイムアウトエラーは無視
            return
          }

          // その他のエラーのみ処理
          let errorMessage = '不明なエラー'
          if ('message' in err) {
            errorMessage = geolocationError.message

            // エラーコードに応じた詳細メッセージ
            if (geolocationError.code === 1) {
              errorMessage =
                '位置情報へのアクセスが拒否されました。ブラウザの設定で許可してください。'
            } else if (geolocationError.code === 2) {
              errorMessage = '現在位置を取得できませんでした。'
            }
          }

          console.error('位置情報の取得に失敗:', errorMessage, err)

          // 通知
          showNotification('位置情報の取得に失敗しました', 'error')
        }

        // フォールバックとしてカスタム位置情報または保存された位置情報を使用
        if (!position && customPosition) {
          console.log('カスタムGeolocationAPIからの位置情報を使用します')
        }
      })
    })

    // 地図ロード完了イベント
    mapInstance.on('load', () => {
      console.log('マップがロードされました')
      setGeolocateInitialized(true)
    })

    setMap(mapInstance)

    return () => {
      console.log('マップをクリーンアップします')
      // マップインスタンスの完全なクリーンアップ
      if (mapInstance) {
        mapInstance.remove()
        setMap(null)
      }
      window.removeEventListener('keydown', handleKeyDown)
      // マーカーもクリーンアップ
      if (userMarkerRef.current) {
        userMarkerRef.current.remove()
        userMarkerRef.current = null
      }
      // GeolocateControlの参照もクリア
      if (geolocateControlRef.current) {
        geolocateControlRef.current = null
      }
      // 初期化フラグもリセット
      mapInitializedRef.current = false
      hasInitialPositionSet.current = false
    }
  }, []) // 依存関係を空にして一度だけ実行

  // シンプルなマーカーを作成する関数
  const createUserMarker = useCallback(
    (lng: number, lat: number) => {
      if (!map) return

      // 既存のマーカーを削除
      if (userMarkerRef.current) {
        userMarkerRef.current.remove()
      }

      try {
        // シンプルなマーカーを作成
        const marker = new mapboxgl.Marker({
          color: '#ff6b6b',
        })
          .setLngLat([lng, lat])
          .addTo(map)

        userMarkerRef.current = marker
        console.log('ユーザーマーカーを作成しました:', { lng, lat })
      } catch (error) {
        console.error('マーカー作成エラー:', error)
      }
    },
    [map],
  )

  // 位置情報が取得できたらマップの中心を移動してマーカーを表示
  useEffect(() => {
    if (!map || !position || !mapStyleLoaded) return

    // 保存された位置情報で既に初期化されている場合は、マーカーのみ表示
    const savedPosition = localStorage.getItem('sonory_last_position')
    let isSavedPosition = false
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition) as LocationData
        isSavedPosition =
          parsed.latitude === position.latitude &&
          parsed.longitude === position.longitude
      } catch (error) {
        console.error('保存された位置情報の解析エラー:', error)
      }
    }

    console.log('マップ更新:', {
      source: mapboxPosition ? 'Mapbox' : 'Custom',
      latitude: position.latitude,
      longitude: position.longitude,
      accuracy: position.accuracy,
      timestamp: new Date(position.timestamp).toLocaleTimeString(),
      isInitial: !hasInitialPositionSet.current,
      isSavedPosition,
    })

    // 保存された位置情報で既に表示されている場合はマーカーのみ更新
    if (isSavedPosition && hasInitialPositionSet.current) {
      // カスタムマーカーを表示（3Dビューでも見えるように）
      createUserMarker(position.longitude, position.latitude)
      return
    }

    // 初回の位置設定かどうかで処理を分ける
    if (!hasInitialPositionSet.current) {
      // 初回は即座に移動（アニメーションなし）
      map.jumpTo({
        center: [position.longitude, position.latitude],
        zoom: 18, // より近いズームレベル（以前: 16）
        pitch: 50, // より低めのピッチ角度（以前: 45）
      })
      hasInitialPositionSet.current = true
    } else {
      // 2回目以降はアニメーション付きで移動
      map.flyTo({
        center: [position.longitude, position.latitude],
        zoom: 18, // より近いズームレベル（以前: 16）
        pitch: 50, // より低めのピッチ角度（以前: 45）
        essential: true,
        duration: 2000,
      })
    }

    // カスタムマーカーを表示（3Dビューでも見えるように）
    createUserMarker(position.longitude, position.latitude)

    // ユーザーパスを更新
    if (map.getSource('user-path')) {
      const source = map.getSource('user-path') as mapboxgl.GeoJSONSource

      // 現在のデータを取得するための安全な方法
      // GeoJSONSourceの内部実装に依存しないアプローチ
      const updatePath = (currentCoordinates: Array<[number, number]>) => {
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

          const updatedFeature: GeoJSONLineStringFeature = {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: updatedCoordinates,
            },
          }

          source.setData(updatedFeature)
        }
      }

      // 初期座標から開始
      updatePath([[position.longitude, position.latitude]])
    }
  }, [map, position, mapStyleLoaded, createUserMarker])

  // 位置情報トラッキングを自動的に開始（mapとgeolocateControlの準備ができたら）
  useEffect(() => {
    // 既に位置情報がある場合（保存された位置情報など）は自動取得をスキップ
    if (position && hasInitialPositionSet.current) {
      console.log('既に位置情報があるため、自動取得をスキップします')
      return
    }

    // マップとGeolocateControlの準備ができていて、まだ試行していない場合
    if (geolocateInitialized && !geolocateAttempted) {
      console.log('位置情報トラッキングを開始します...')

      // 少し遅延させてから実行（マップの準備が完全に整ってから）
      const timer = setTimeout(() => {
        attemptGeolocation()
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [geolocateInitialized, geolocateAttempted, position]) // positionを依存関係に追加

  // リアルタイムで光と影を更新する関数
  const updateLightingAndShadows = useCallback(
    (mapInstance: mapboxgl.Map) => {
      if (!position) return

      const now = new Date()
      const hour = now.getHours()

      // 時間帯に応じたライトプリセットを設定
      let lightPreset = 'day'
      if (hour >= 5 && hour < 8) {
        lightPreset = 'dawn'
      } else if (hour >= 17 && hour < 19) {
        lightPreset = 'dusk'
      } else if (hour >= 19 || hour < 5) {
        lightPreset = 'night'
      }

      try {
        // Standard Styleのライトプリセットを更新
        mapboxHelpers.setConfigProperty(
          mapInstance,
          'basemap',
          'lightPreset',
          lightPreset,
        )

        // カスタムの太陽光計算も維持（より詳細な制御のため）
        const sunPosition = calculateSunPosition(
          now,
          position.latitude,
          position.longitude,
        )

        const baseLighting = getLightingConfig(sunPosition.altitude)
        const lighting = applyWeatherEffects(baseLighting, currentWeather)
        setCurrentLighting(lighting)

        // 追加の光源設定（Standard Styleを補完）
        const lightConfig: MapboxLightConfig = {
          anchor: 'viewport',
          position: [
            1.5,
            sunPosition.azimuth,
            90 - Math.max(0, sunPosition.altitude),
          ],
          color: lighting.sunColor,
          intensity: lighting.sunIntensity * 0.5, // Standard Styleと併用するため強度を調整
        }
        mapboxHelpers.setLight(mapInstance, lightConfig)

        // 環境光を設定
        const atmosphereConfig = getAtmosphereConfig(lighting)
        const fogConfig = {
          ...atmosphereConfig,
          range: [0.5, 10],
          color: lighting.fogColor,
          'horizon-blend': lighting.fogDensity * 0.5,
        }
        mapboxHelpers.setFog(mapInstance, fogConfig)

        // 夜間の照明効果を適用
        applyNightLighting(mapInstance, sunPosition.altitude)
      } catch (error) {
        console.error('光と影の更新エラー:', error)
      }
    },
    [position, currentWeather],
  )

  // 定期的に光と影を更新
  useEffect(() => {
    if (!map || !mapStyleLoaded || !position) return

    // 初回更新
    updateLightingAndShadows(map)

    // 1分ごとに更新
    const interval = setInterval(() => {
      updateLightingAndShadows(map)
    }, 60000)

    return () => clearInterval(interval)
  }, [map, mapStyleLoaded, position, updateLightingAndShadows])

  return (
    <>
      <div
        ref={mapContainerRef}
        className="absolute top-0 left-0 w-full h-full z-0"
      />
      {/* デバッグ情報表示 */}
      {debugMode && (
        <div className="absolute bottom-2.5 left-2.5 bg-black/70 text-white p-2 rounded-md text-xs max-w-xs z-[1000] pointer-events-none">
          <pre style={{ margin: 0 }}>
            {position
              ? `位置: ${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}
精度: ${position.accuracy.toFixed(1)}m
更新: ${new Date(position.timestamp).toLocaleTimeString()}
権限: ${permissionStatus}
ソース: ${mapboxPosition ? 'Mapbox (高精度)' : 'カスタム'}
初期化: ${geolocateInitialized ? '完了' : '未完了'}
試行: ${geolocateAttempted ? '完了' : '未完了'}
${
  currentLighting
    ? `
太陽強度: ${(currentLighting.sunIntensity * 100).toFixed(0)}%
影強度: ${(currentLighting.shadowIntensity * 100).toFixed(0)}%
霧密度: ${(currentLighting.fogDensity * 100).toFixed(0)}%`
    : ''
}`
              : '位置情報: 取得中...'}
          </pre>
        </div>
      )}
    </>
  )
}

// next/dynamicで使用するためにデフォルトエクスポートを追加
export default MapComponent
