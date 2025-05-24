import { create } from 'zustand'
import type { AudioData, RecorderState } from './types'

/**
 * 録音機能を管理するZustandストア
 *
 * 録音の開始、停止、一時停止、再開、リセットなどの機能を提供します。
 * MediaRecorder APIを使用して録音を行います。
 */
export const useRecorderStore = create<RecorderState>((set) => ({
  // 初期状態
  status: 'idle',
  audioData: null,
  elapsedTime: 0,

  // 録音開始
  startRecording: () => {
    set({ status: 'recording', elapsedTime: 0 })
  },

  // 録音停止
  stopRecording: () => {
    set((state) => {
      // すでに完了状態の場合は何もしない
      if (state.status === 'completed') return state

      return { status: 'completed' }
    })
  },

  // 録音一時停止
  pauseRecording: () => {
    set((state) => {
      // 録音中の場合のみ一時停止可能
      if (state.status !== 'recording') return state

      return { status: 'paused' }
    })
  },

  // 録音再開
  resumeRecording: () => {
    set((state) => {
      // 一時停止中の場合のみ再開可能
      if (state.status !== 'paused') return state

      return { status: 'recording' }
    })
  },

  // 録音データのリセット
  resetRecording: () => {
    set({
      status: 'idle',
      audioData: null,
      elapsedTime: 0,
    })
  },

  // 録音時間の更新
  updateElapsedTime: (time: number) => {
    set({ elapsedTime: time })
  },

  // 録音データの設定
  setAudioData: (data: AudioData) => {
    set({ audioData: data })
  },
}))
