import mapboxgl from 'mapbox-gl'
import { useCallback } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'

// 環境変数からMapbox Access Tokenを取得
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

// カラフルでスタイリッシュなカスタムスタイル
const CUSTOM_STYLE = {
  version: 8,
  name: 'Sonory Custom Style',
  sources: {
    mapbox: {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-streets-v8',
    },
  },
  sprite: 'mapbox://sprites/mapbox/bright-v9',
  glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
  layers: [
    // 背景
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#f0f7fa',
      },
    },
    // 水域
    {
      id: 'water',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'water',
      paint: {
        'fill-color': '#bde0f2',
      },
    },
    // 公園・緑地
    {
      id: 'landuse_park',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'landuse',
      filter: ['==', 'class', 'park'],
      paint: {
        'fill-color': '#c8e6c9',
      },
    },
    // 森林
    {
      id: 'landuse_forest',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'landuse',
      filter: ['==', 'class', 'forest'],
      paint: {
        'fill-color': '#a5d6a7',
      },
    },
    // 道路（主要）
    {
      id: 'road_major',
      type: 'line',
      source: 'mapbox',
      'source-layer': 'road',
      filter: [
        'all',
        [
          '!in',
          'class',
          'street',
          'street_limited',
          'service',
          'track',
          'path',
        ],
      ],
      paint: {
        'line-color': '#ffffff',
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10,
          1,
          15,
          3,
          20,
          8,
        ],
        'line-opacity': 0.8,
      },
    },
    // 道路（一般）
    {
      id: 'road_minor',
      type: 'line',
      source: 'mapbox',
      'source-layer': 'road',
      filter: ['in', 'class', 'street', 'street_limited'],
      paint: {
        'line-color': '#ffffff',
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          12,
          0.5,
          15,
          2,
          20,
          6,
        ],
        'line-opacity': 0.6,
      },
    },
    // 建物の影
    {
      id: 'building_shadow',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'building',
      paint: {
        'fill-color': '#000000',
        'fill-opacity': 0.05,
        'fill-translate': [2, 2],
      },
    },
    // 建物
    {
      id: 'building',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'building',
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          '#e1e9ed',
          18,
          '#f5f5f5',
        ],
        'fill-outline-color': '#dce3e8',
      },
    },
    // 地名ラベル
    {
      id: 'place_label',
      type: 'symbol',
      source: 'mapbox',
      'source-layer': 'place_label',
      layout: {
        'text-field': ['get', 'name_ja'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 10, 10, 15, 14],
        'text-letter-spacing': 0.1,
        'text-transform': 'uppercase',
      },
      paint: {
        'text-color': '#5d6d7e',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1,
      },
    },
  ],
} as mapboxgl.Style

/**
 * Mapbox GLの初期化と制御を行うフック
 *
 * マップの初期化と制御機能を提供する
 *
 * @returns Mapboxの初期化関数
 */
export function useMapbox() {
  // Mapbox Access Tokenを設定
  if (MAPBOX_ACCESS_TOKEN) {
    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN
  } else {
    console.error('Mapbox access token is not defined')
  }

  // マップの初期化関数
  const initializeMap = useCallback((container: HTMLElement): mapboxgl.Map => {
    const map = new mapboxgl.Map({
      container,
      style: CUSTOM_STYLE,
      center: [139.6917, 35.6895] as [number, number], // 東京（デフォルト）
      zoom: 14,
      pitch: 45, // 3D効果のために45度の傾き
      bearing: 20, // 少し回転させてダイナミックに
      attributionControl: false,
      antialias: true, // 3D表示を滑らかにする
    })

    // 3Dビルディングレイヤーを追加
    map.on('style.load', () => {
      // 建物の3D表示
      map.addLayer({
        id: '3d-buildings',
        source: 'mapbox',
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 14,
        paint: {
          'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['zoom'],
            14,
            '#e1e9ed',
            16,
            '#f5f5f5',
          ],
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            14,
            0,
            16,
            ['get', 'height'],
          ],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.7,
          'fill-extrusion-vertical-gradient': true,
        },
      })
    })

    // マップの傾きを制御できるようにする
    map.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true, // ピッチコントロールを表示
      }),
      'bottom-right',
    )

    // 現在地コントロールを追加
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'bottom-right',
    )

    // 著作権表示を追加
    map.addControl(
      new mapboxgl.AttributionControl({
        compact: true,
      }),
    )

    return map
  }, [])

  return { initializeMap }
}
