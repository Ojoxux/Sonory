'use client'

import { Box } from '@chakra-ui/react'
import mapboxgl from 'mapbox-gl'
import { useCallback, useEffect, useRef, useState } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useGeolocation } from './hooks/useGeolocation'

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

// 位置情報の型定義
type LocationData = {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

/**
 * Mapbox GLを使用したマップコンポーネント
 *
 * Zenlyスタイルのシンプルな地図表示と、時間帯に応じた色変化を提供
 * 3D建物表示機能を含む
 */
export function MapComponent(): React.ReactElement {
  const mapContainerRef = useRef<HTMLDivElement>(null)

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

  // 実際に使用する位置情報（Mapboxの位置情報を優先）
  const position = mapboxPosition || customPosition
  const geolocateControlRef = useRef<mapboxgl.GeolocateControl | null>(null)
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null)

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
    if (!mapContainerRef.current || map) return // 既にマップが存在する場合は何もしない

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

    // Zenlyスタイル風のシンプルなマップ設定
    const mapInstance = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11', // シンプルな明るいスタイル
      center: [139.6917, 35.6895], // 東京
      zoom: 14,
      pitch: 45, // 3D効果の傾き
      bearing: 0,
      antialias: true,
      attributionControl: true, // 著作権表示を有効に
      logoPosition: 'bottom-left',
    })

    // スタイル読み込み完了時のイベント
    mapInstance.on('style.load', () => {
      // 3D建物レイヤーを追加（シンプルなスタイル）
      if (!mapInstance.getLayer('3d-buildings')) {
        const layers = mapInstance.getStyle().layers || []

        // labelレイヤーを見つける
        const labelLayerId = layers.find(
          (layer) =>
            layer.type === 'symbol' &&
            layer.layout !== undefined &&
            'text-field' in (layer.layout || {}),
        )?.id

        // 建物の3D表示（シンプルなデザイン）
        mapInstance.addLayer(
          {
            id: '3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 14,
            paint: {
              // 時間帯に応じた建物色の設定
              'fill-extrusion-color': getTimeBasedBuildingColor(),
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                14,
                0,
                15,
                ['get', 'height'],
              ],
              'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                14,
                0,
                15,
                ['get', 'min_height'],
              ],
              'fill-extrusion-opacity': 0.7,
              'fill-extrusion-vertical-gradient': true,
            },
          },
          labelLayerId,
        )
      }

      // 時間帯に応じた空の色設定
      const hour = new Date().getHours()
      let skyColor = '#c4e0f4' // 昼間の空色
      let horizonColor = '#ffffff'

      if (hour >= 5 && hour < 8) {
        // 朝の暖かい色
        skyColor = '#FFB347'
        horizonColor = '#FFF8DC'
      } else if (hour >= 17 && hour < 19) {
        // 夕焼け色
        skyColor = '#FF6347'
        horizonColor = '#FFE4B5'
      } else if (hour >= 19 && hour < 21) {
        // 夕暮れ
        skyColor = '#9370DB'
        horizonColor = '#DDA0DD'
      } else if (hour >= 21 || hour < 5) {
        // 夜の濃い青
        skyColor = '#191970'
        horizonColor = '#4169E1'
      }

      try {
        // setSkyメソッドが存在するかチェック
        if (supportsMethod(mapInstance, 'setSky')) {
          // @ts-expect-error - 型定義に含まれないMapboxのメソッド
          mapInstance.setSky({
            'sky-color': skyColor,
            'horizon-color': horizonColor,
            'fog-color': horizonColor,
            'fog-ground-blend': 0.8,
            'sky-opacity': 0.8,
          })
        }
      } catch (error) {
        console.error('Sky not available:', error)
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

      setMapStyleLoaded(true)
    })

    // 地図ロード完了イベント
    mapInstance.on('load', () => {
      console.log('マップがロードされました')
      setGeolocateInitialized(true)
    })

    setMap(mapInstance)

    return () => {
      mapInstance.remove()
      window.removeEventListener('keydown', handleKeyDown)
      // マーカーもクリーンアップ
      if (userMarkerRef.current) {
        userMarkerRef.current.remove()
      }
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

    console.log('マップ更新:', {
      source: mapboxPosition ? 'Mapbox' : 'Custom',
      latitude: position.latitude,
      longitude: position.longitude,
      accuracy: position.accuracy,
      timestamp: new Date(position.timestamp).toLocaleTimeString(),
    })

    // マップの中心を現在位置に移動
    map.flyTo({
      center: [position.longitude, position.latitude],
      zoom: 16,
      pitch: 45,
      essential: true,
      duration: 2000,
    })

    // カスタムマーカーを表示（3Dビューでも見えるように）
    createUserMarker(position.longitude, position.latitude)
  }, [map, position, mapStyleLoaded, createUserMarker])

  // 位置情報トラッキングを自動的に開始（mapとgeolocateControlの準備ができたら）
  useEffect(() => {
    // マップとGeolocateControlの準備ができていて、まだ試行していない場合
    if (geolocateInitialized && !geolocateAttempted) {
      console.log('位置情報トラッキングを開始します...')

      // 少し遅延させてから実行（マップの準備が完全に整ってから）
      const timer = setTimeout(() => {
        attemptGeolocation()
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [geolocateInitialized, geolocateAttempted]) // attemptGeolocationを依存関係から除外

  return (
    <>
      <Box
        ref={mapContainerRef}
        position="absolute"
        top="0"
        left="0"
        width="100%"
        height="100%"
        zIndex="0"
      />
      {/* デバッグ情報表示 */}
      {debugMode && (
        <Box
          position="absolute"
          bottom="10px"
          left="10px"
          bg="rgba(0,0,0,0.7)"
          color="white"
          p={2}
          borderRadius="md"
          fontSize="xs"
          maxW="300px"
          zIndex="1000"
          pointerEvents="none"
        >
          <pre style={{ margin: 0 }}>
            {position
              ? `位置: ${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}
精度: ${position.accuracy.toFixed(1)}m
更新: ${new Date(position.timestamp).toLocaleTimeString()}
権限: ${permissionStatus}
ソース: ${mapboxPosition ? 'Mapbox (高精度)' : 'カスタム'}
初期化: ${geolocateInitialized ? '完了' : '未完了'}
試行: ${geolocateAttempted ? '完了' : '未完了'}`
              : '位置情報: 取得中...'}
          </pre>
        </Box>
      )}
    </>
  )
}

/**
 * 時間帯に応じた建物色を取得
 *
 * @returns 時間帯に適した建物色
 */
function getTimeBasedBuildingColor(): string {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 8) {
    return '#ffd7a8' // 朝
  } else if (hour >= 8 && hour < 17) {
    return '#e3e3e3' // 昼
  } else if (hour >= 17 && hour < 19) {
    return '#ffbfa8' // 夕方
  } else if (hour >= 19 && hour < 21) {
    return '#d7c5e8' // 夕暮れ
  } else {
    return '#a8b8d8' // 夜
  }
}

// next/dynamicで使用するためにデフォルトエクスポートを追加
export default MapComponent
