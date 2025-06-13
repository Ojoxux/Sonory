'use client'

import { memo, useEffect, useRef, useState } from 'react'
import type { LocationDisplayProps } from './type'

// 位置情報のキャッシュ
const locationCache = new Map<string, string>()

/**
 * 位置情報表示コンポーネント
 *
 * @description
 * 現在の地域名を英語で表示するAtomコンポーネント
 * タイポグラフィを重視したデザイン
 * メモ化とキャッシュにより不要な再レンダリングとAPIコールを防止
 *
 * @param latitude 緯度
 * @param longitude 経度
 * @param className クラス名
 *
 * @example
 * ```tsx
 * <LocationDisplay latitude={37.1234} longitude={139.1234} />
 * ```
 */
export const LocationDisplay = memo(function LocationDisplay({
  latitude,
  longitude,
  className = '',
  debugTimeOverride = null,
}: LocationDisplayProps) {
  // 前回の位置情報を保持
  const prevLocationRef = useRef<{
    lat: number
    lon: number
    name: string
  } | null>(null)

  const [locationName, setLocationName] = useState<string>(() => {
    // 前回の位置情報があれば使用
    if (prevLocationRef.current && latitude && longitude) {
      const prevLat = Math.round(prevLocationRef.current.lat * 100) / 100
      const prevLon = Math.round(prevLocationRef.current.lon * 100) / 100
      const currentLat = Math.round(latitude * 100) / 100
      const currentLon = Math.round(longitude * 100) / 100

      if (prevLat === currentLat && prevLon === currentLon) {
        return prevLocationRef.current.name
      }
    }
    return ''
  })

  const [isLoading, setIsLoading] = useState(() => {
    // 既に位置情報がある場合はローディングをスキップ
    return locationName === ''
  })

  const [isDarkTime, setIsDarkTime] = useState(false)
  const fetchedRef = useRef(false)

  // 時間帯をチェック（17時以降を夜の時間帯とする）
  useEffect(() => {
    const checkTimeOfDay = () => {
      // デバッグ時間オーバーライドがある場合はそれを使用、なければ現在時刻
      const hour =
        debugTimeOverride !== null ? debugTimeOverride : new Date().getHours()
      setIsDarkTime(hour >= 17 || hour < 5)
    }

    checkTimeOfDay()
    const interval = setInterval(checkTimeOfDay, 60000) // 1分ごとに更新

    return () => clearInterval(interval)
  }, [debugTimeOverride])

  useEffect(() => {
    const fetchLocationName = async () => {
      if (!latitude || !longitude) {
        setLocationName('')
        setIsLoading(false)
        return
      }

      // キャッシュキーを作成（小数点以下2桁に丸めて、より広い範囲でキャッシュ）
      const roundedLat = Math.round(latitude * 100) / 100
      const roundedLon = Math.round(longitude * 100) / 100
      const cacheKey = `${roundedLat},${roundedLon}`

      // キャッシュをチェック
      const cached = locationCache.get(cacheKey)
      if (cached) {
        setLocationName(cached)
        setIsLoading(false)
        return
      }

      // 既にフェッチ中の場合はスキップ
      if (fetchedRef.current) return
      fetchedRef.current = true

      try {
        setIsLoading(true)

        // Nominatim APIを使用して逆ジオコーディング
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`,
        )
        const data = await response.json()

        // 地域名の優先順位: city > town > village > county > state
        const location =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.county ||
          data.address?.state ||
          ''

        setLocationName(location)

        // キャッシュに保存（元の座標と丸めた座標の両方でキャッシュ）
        if (location) {
          locationCache.set(cacheKey, location)
          // 元の精度でもキャッシュ
          const originalKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`
          locationCache.set(originalKey, location)

          // 前回の位置情報として保存
          prevLocationRef.current = {
            lat: latitude,
            lon: longitude,
            name: location,
          }
        }
      } catch (error) {
        console.error('Failed to fetch location name:', error)
        setLocationName('')
      } finally {
        setIsLoading(false)
        fetchedRef.current = false
      }
    }

    // 少し遅延を入れて、頻繁な更新を防ぐ
    const timer = setTimeout(() => {
      fetchLocationName()
    }, 300)

    return () => clearTimeout(timer)
  }, [latitude, longitude])

  // 位置情報がない場合は何も表示しない
  if (!latitude || !longitude || (!locationName && !isLoading)) {
    return null
  }

  // 時間帯に応じたスタイル
  const textColorClass = isDarkTime ? 'text-white' : 'text-gray-900'
  const borderColorClass = isDarkTime ? 'border-white' : 'border-gray-900'

  return (
    <div className={`relative ${className}`}>
      <div
        className={`transition-all duration-500 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
      >
        {isLoading ? (
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full animate-pulse ${isDarkTime ? 'bg-white/50' : 'bg-gray-400'}`}
            />
            <span
              className={`text-5xl font-bold tracking-tight font-arial-rounded-mt-pro ${isDarkTime ? 'text-white/50' : 'text-gray-400'}`}
            >
              Loading
            </span>
          </div>
        ) : (
          <div className="inline-block">
            <h2
              className={`text-6xl font-bold tracking-tight font-arial-rounded-mt-pro ${textColorClass} pb-2 leading-none`}
            >
              {locationName}
            </h2>
            <div className={`h-0.5 w-full ${borderColorClass} border-b-2`} />
            <p
              className={`text-sm mt-3 font-bold tracking-wide font-arial-rounded-mt-pro ${isDarkTime ? 'text-white/50' : 'text-gray-500'}`}
            >
              {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
            </p>
          </div>
        )}
      </div>
    </div>
  )
})
