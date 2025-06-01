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
import { useDebugStore } from '@/store/useDebugStore'
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
  MapComponentProps,
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
export function MapComponent({
  onGeolocationReady,
  onReturnToLocationReady,
  onBearingChange,
}: MapComponentProps): ReactElement {
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
  const {
    debugMode,
    toggleDebugMode,
    debugTimeOverride,
    setDebugTimeOverride,
  } = useDebugStore()
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

  // 段階的フォールバック戦略による位置情報取得
  const attemptGeolocation = useCallback(() => {
    console.log('attemptGeolocation呼び出し:', {
      control: !!geolocateControlRef.current,
      initialized: geolocateInitialized,
      attempted: geolocateAttempted,
    })

    setGeolocateAttempted(true)
    console.log('位置情報の取得を試みます...')

    if (!('geolocation' in navigator)) {
      console.warn('Geolocation APIがサポートされていません')
      // 保存された位置情報があればそれを使用
      const savedPosition = localStorage.getItem('sonory_last_position')
      if (savedPosition) {
        try {
          const parsed = JSON.parse(savedPosition) as LocationData
          console.log('保存された位置情報を使用します')
          setMapboxPosition(parsed)
        } catch (error) {
          console.error('保存された位置情報の解析エラー:', error)
        }
      }
      return
    }

    // 段階的フォールバック戦略
    const tryGeolocation = (
      options: PositionOptions,
      fallbackLevel: number,
    ) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log(
            `位置情報取得成功 (レベル${fallbackLevel}):`,
            position.coords,
          )
          const newPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
          }
          setMapboxPosition(newPosition)

          // デバッグモード時のみ成功通知
          if (debugMode) {
            showNotification('位置情報を更新しました', 'success')
          }

          // マップの視点を更新（斜めから見下ろす視点を維持）
          if (map) {
            map.flyTo({
              center: [newPosition.longitude, newPosition.latitude],
              zoom: 18,
              pitch: 50,
              bearing: -20,
              essential: true,
              duration: 2000,
            })
          }
        },
        (error) => {
          console.log(
            `位置情報取得失敗 (レベル${fallbackLevel}):`,
            error.code,
            error.message,
          )

          // 段階的フォールバック
          if (fallbackLevel === 1 && error.code === 3) {
            // レベル1: 高精度モード、短いタイムアウト → レベル2: 低精度モード、長いタイムアウト
            console.log('レベル2フォールバック: 低精度モードで再試行')
            tryGeolocation(
              {
                enableHighAccuracy: false,
                timeout: 15000,
                maximumAge: 300000, // 5分以内のキャッシュを許可
              },
              2,
            )
          } else if (fallbackLevel === 2) {
            // レベル2失敗 → レベル3: 保存された位置情報を使用
            console.log('レベル3フォールバック: 保存された位置情報を使用')
            const savedPosition = localStorage.getItem('sonory_last_position')
            if (savedPosition) {
              try {
                const parsed = JSON.parse(savedPosition) as LocationData
                console.log('保存された位置情報を使用します')
                setMapboxPosition(parsed)

                if (debugMode) {
                  showNotification(
                    '保存された位置情報を使用しました',
                    'warning',
                  )
                }
                return
              } catch (parseError) {
                console.error('保存された位置情報の解析エラー:', parseError)
              }
            }

            // レベル4: Mapboxのgeolocationコントロールを試行
            if (geolocateControlRef.current && geolocateInitialized) {
              console.log('レベル4フォールバック: Mapboxコントロールを使用')
              try {
                geolocateControlRef.current.trigger()
              } catch (triggerError) {
                console.error('Mapbox trigger失敗:', triggerError)
                // 最終的に失敗した場合は静かに処理（ユーザーには通知しない）
                console.log('すべてのフォールバックが失敗しました')
              }
            } else {
              // 最終的に失敗した場合は静かに処理
              console.log('すべてのフォールバックが失敗しました')
            }
          } else {
            // その他のエラー（権限拒否など）は即座に処理
            if (error.code === 1) {
              console.warn('位置情報へのアクセスが拒否されました')
              if (debugMode) {
                showNotification(
                  '位置情報へのアクセスが拒否されました',
                  'warning',
                )
              }
            } else {
              console.warn('位置情報取得エラー:', error.message)
            }
          }
        },
        options,
      )
    }

    // レベル1: 高精度モード、短いタイムアウトで開始
    tryGeolocation(
      {
        enableHighAccuracy: true,
        timeout: 5000, // 短いタイムアウト
        maximumAge: 0,
      },
      1,
    )
  }, [geolocateInitialized, showNotification, map, debugMode]) // debugModeを依存関係に追加

  // 現在位置に確実に戻る関数
  const returnToCurrentLocation = useCallback(() => {
    console.log('現在位置に戻ります...')

    // まず保存された位置情報があるかチェック
    const savedPosition = localStorage.getItem('sonory_last_position')
    let fallbackPosition: LocationData | null = null

    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition) as LocationData
        // 24時間以内の位置情報のみ使用
        const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000
        if (isRecent) {
          fallbackPosition = parsed
        }
      } catch (error) {
        console.error('保存された位置情報の解析エラー:', error)
      }
    }

    // 現在の位置情報または保存された位置情報を使用
    const targetPosition = position || fallbackPosition

    if (targetPosition && map) {
      console.log('位置情報が利用可能です。マップを移動します:', targetPosition)

      // マップの視点を現在位置に移動
      map.flyTo({
        center: [targetPosition.longitude, targetPosition.latitude],
        zoom: 18,
        pitch: 50,
        bearing: -20,
        essential: true,
        duration: 2000,
      })

      // マーカーも更新（直接作成）
      if (userMarkerRef.current) {
        userMarkerRef.current.remove()
      }

      try {
        const marker = new mapboxgl.Marker({
          color: '#ff6b6b',
        })
          .setLngLat([targetPosition.longitude, targetPosition.latitude])
          .addTo(map)

        userMarkerRef.current = marker
        console.log('ユーザーマーカーを作成しました:', {
          lng: targetPosition.longitude,
          lat: targetPosition.latitude,
        })
      } catch (error) {
        console.error('マーカー作成エラー:', error)
      }

      // 通知
      showNotification('現在位置に戻りました', 'success')
    } else {
      console.log('位置情報が利用できません。新しい位置情報を取得します...')

      // 位置情報が利用できない場合は新しく取得を試行
      attemptGeolocation()
    }
  }, [position, map, showNotification, attemptGeolocation])

  // 位置情報取得関数を親コンポーネントに公開
  useEffect(() => {
    if (onGeolocationReady && attemptGeolocation) {
      onGeolocationReady(attemptGeolocation)
    }
  }, [onGeolocationReady, attemptGeolocation])

  // 現在位置に戻る関数を親コンポーネントに公開
  useEffect(() => {
    if (onReturnToLocationReady && returnToCurrentLocation) {
      onReturnToLocationReady(returnToCurrentLocation)
    }
  }, [onReturnToLocationReady, returnToCurrentLocation])

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

      // 初期bearing値を通知
      if (onBearingChange) {
        onBearingChange(mapInstance.getBearing())
      }
    })

    // マップの回転（bearing）変更を監視
    mapInstance.on('rotate', () => {
      if (onBearingChange) {
        onBearingChange(mapInstance.getBearing())
      }
    })

    setMap(mapInstance)

    return () => {
      console.log('マップをクリーンアップします')
      // マップインスタンスの完全なクリーンアップ
      if (mapInstance) {
        mapInstance.remove()
        setMap(null)
      }
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

  // キーボードショートカットの設定
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('キーイベント:', { shift: e.shiftKey, key: e.key })

      // Shift + D でデバッグモード切り替え
      if (e.shiftKey && e.key === 'D') {
        console.log('デバッグモード切り替え')
        toggleDebugMode() // グローバルなデバッグモード切り替え
      }

      // Shift + G で位置情報を再取得
      if (e.shiftKey && e.key === 'G') {
        console.log('位置情報再取得を実行')
        e.preventDefault()
        attemptGeolocation()
      }

      // Shift + R で位置情報キャッシュをクリアして再取得
      if (e.shiftKey && e.key === 'R') {
        console.log('位置情報キャッシュをクリアして再取得します...')
        e.preventDefault()
        localStorage.removeItem('sonory_last_position')
        setMapboxPosition(null)
        hasInitialPositionSet.current = false
        setGeolocateAttempted(false)

        // 現在の視点を保存
        const currentCenter = map?.getCenter()
        const currentZoom = map?.getZoom()
        const currentBearing = map?.getBearing()

        // 少し遅延させてから再取得
        setTimeout(() => {
          // 視点をリセット（斜めから見下ろす視点に戻す）
          if (map && currentCenter) {
            map.flyTo({
              center: [currentCenter.lng, currentCenter.lat],
              zoom: currentZoom || 18,
              pitch: 50, // 斜めから見下ろす視点
              bearing: currentBearing || -20,
              essential: true,
              duration: 1000,
            })
          }
          attemptGeolocation()
        }, 500)
      }

      // デバッグモード時の時間帯変更ショートカット
      if (debugMode) {
        // Shift + 1-4 で時間帯を変更
        if (e.shiftKey && ['1', '2', '3', '4'].includes(e.key)) {
          e.preventDefault()
          const timeMap: Record<string, number> = {
            '1': 6, // 朝 (dawn)
            '2': 12, // 昼 (day)
            '3': 18, // 夕方 (dusk)
            '4': 22, // 夜 (night)
          }
          const newTime = timeMap[e.key]
          setDebugTimeOverride(newTime)
          console.log(`デバッグ時間を${newTime}時に設定しました`)

          // 即座にライティングを更新
          if (map) {
            updateLightingAndShadows(map)
          }
        }

        // Shift + 0 でデバッグ時間をリセット
        if (e.shiftKey && e.key === '0') {
          e.preventDefault()
          setDebugTimeOverride(null)
          console.log('デバッグ時間をリセットしました')

          // 即座にライティングを更新
          if (map) {
            updateLightingAndShadows(map)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [attemptGeolocation, toggleDebugMode]) // 依存関係に toggleDebugMode を追加

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
    // 保存された位置情報がある場合でも、24時間以上経過していれば再取得
    const savedPosition = localStorage.getItem('sonory_last_position')
    let shouldSkipAutoLocation = false

    if (position && hasInitialPositionSet.current && savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition) as LocationData
        const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000

        // 24時間以内の保存された位置情報がある場合のみスキップ
        if (isRecent) {
          console.log(
            '24時間以内の位置情報があるため、自動取得をスキップします',
          )
          shouldSkipAutoLocation = true
        } else {
          console.log(
            '保存された位置情報が古いため、新しい位置情報を取得します',
          )
          localStorage.removeItem('sonory_last_position')
          hasInitialPositionSet.current = false
          setGeolocateAttempted(false)
        }
      } catch (error) {
        console.error('保存された位置情報の解析エラー:', error)
        localStorage.removeItem('sonory_last_position')
        hasInitialPositionSet.current = false
        setGeolocateAttempted(false)
      }
    }

    if (shouldSkipAutoLocation) {
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
      // デバッグ時間オーバーライドがある場合はそれを使用、なければ現在時刻
      const hour =
        debugTimeOverride !== null ? debugTimeOverride : now.getHours()

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
    [position, currentWeather, debugTimeOverride],
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
        <div className="absolute bottom-30 left-2.5 bg-black/70 text-white p-3 rounded-md text-xs max-w-sm z-[1000]">
          <div className="pointer-events-none mb-3">
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
}

現在時間: ${debugTimeOverride !== null ? `${debugTimeOverride}時 (デバッグ)` : `${new Date().getHours()}時 (実時間)`}`
                : '位置情報: 取得中...'}
            </pre>
          </div>

          {/* 時間帯変更ボタン */}
          <div className="pointer-events-auto">
            <div className="text-white text-xs mb-2 font-semibold">
              時間帯変更:
            </div>
            <div className="grid grid-cols-2 gap-1 mb-2">
              <button
                onClick={() => {
                  setDebugTimeOverride(6)
                  if (map) updateLightingAndShadows(map)
                }}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  debugTimeOverride === 6
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                }`}
              >
                朝 (6時)
              </button>
              <button
                onClick={() => {
                  setDebugTimeOverride(12)
                  if (map) updateLightingAndShadows(map)
                }}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  debugTimeOverride === 12
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                }`}
              >
                昼 (12時)
              </button>
              <button
                onClick={() => {
                  setDebugTimeOverride(18)
                  if (map) updateLightingAndShadows(map)
                }}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  debugTimeOverride === 18
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                }`}
              >
                夕方 (18時)
              </button>
              <button
                onClick={() => {
                  setDebugTimeOverride(22)
                  if (map) updateLightingAndShadows(map)
                }}
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
              onClick={() => {
                setDebugTimeOverride(null)
                if (map) updateLightingAndShadows(map)
              }}
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
                onClick={() => {
                  // PWAインストールプロンプトを表示するためにイベントを発火
                  const event = new CustomEvent('pwa-debug-show', {
                    detail: { expanded: false },
                  })
                  window.dispatchEvent(event)
                }}
                className="px-2 py-1 rounded text-xs transition-colors bg-gray-600 hover:bg-gray-500 text-gray-200"
              >
                表示（縮小）
              </button>
              <button
                onClick={() => {
                  // PWAインストールプロンプトを展開表示
                  const event = new CustomEvent('pwa-debug-show', {
                    detail: { expanded: true },
                  })
                  window.dispatchEvent(event)
                }}
                className="px-2 py-1 rounded text-xs transition-colors bg-gray-600 hover:bg-gray-500 text-gray-200"
              >
                表示（展開）
              </button>
              <button
                onClick={() => {
                  // PWAインストールプロンプトを非表示
                  const event = new CustomEvent('pwa-debug-hide')
                  window.dispatchEvent(event)
                }}
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
      )}
    </>
  )
}

// next/dynamicで使用するためにデフォルトエクスポートを追加
export default MapComponent
