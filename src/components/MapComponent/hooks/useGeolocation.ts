import { useEffect, useState } from 'react'

type Position = {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

/**
 * デバイスの位置情報を取得するフック
 *
 * Geolocation APIを使用して現在の位置情報を取得する
 * 高精度モードを有効にし、位置情報の更新を継続的に監視
 * @returns 現在位置と取得エラー
 */
export function useGeolocation() {
  const [position, setPosition] = useState<Position | null>(null)
  const [error, setError] = useState<GeolocationPositionError | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<string>('pending')

  useEffect(() => {
    // ブラウザがGeolocation APIをサポートしているかチェック
    if (!('geolocation' in navigator)) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by your browser',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      })
      setPermissionStatus('unsupported')
      return
    }

    // 位置情報権限をチェック（可能な場合）
    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((result) => {
          setPermissionStatus(result.state)

          // 権限の変更を監視
          result.addEventListener('change', () => {
            setPermissionStatus(result.state)
          })
        })
        .catch((err) => {
          console.warn('Permission API not supported:', err)
        })
    }

    // 位置情報取得成功時のコールバック
    const handleSuccess = (position: GeolocationPosition) => {
      console.log('位置情報を更新:', {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        acc: position.coords.accuracy,
        timestamp: position.timestamp,
      })

      setPosition({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      })
    }

    // 位置情報取得失敗時のコールバック
    const handleError = (error: GeolocationPositionError) => {
      // タイムアウトエラーの場合は静かに処理（ログも出さない）
      if (error.code === error.TIMEOUT) {
        // タイムアウトエラーは無視（ユーザーに通知しない）
        return
      }

      console.error('位置情報の取得エラー:', error.message)
      setError(error)

      // エラーコードに応じたメッセージを設定
      if (error.code === error.PERMISSION_DENIED) {
        setPermissionStatus('denied')
        console.warn(
          '位置情報へのアクセスが拒否されました。ブラウザの設定で許可してください。',
        )
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        console.warn(
          '現在位置を取得できませんでした。GPS信号が弱い可能性があります。',
        )
      }
    }

    // 位置情報を取得（最初の1回）- タイムアウトエラーを防ぐ設定
    const initialOptions = {
      enableHighAccuracy: false, // 高精度を無効にしてタイムアウトを防ぐ
      timeout: Infinity, // タイムアウトを無効化
      maximumAge: 300000, // 5分以内のキャッシュを許可
    }

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      initialOptions,
    )

    // 位置情報を継続的に監視
    const watchOptions = {
      enableHighAccuracy: false, // 高精度を無効にしてタイムアウトを防ぐ
      timeout: Infinity, // タイムアウトを無効化
      maximumAge: 300000, // 5分以内のキャッシュを許可
    }

    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      watchOptions,
    )

    // クリーンアップ
    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  return { position, error, permissionStatus }
}
