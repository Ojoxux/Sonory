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

   /**
    * 録音を開始します
    *
    * 録音状態を'recording'に設定し、経過時間をリセットします
    * 実際の録音開始処理はUIコンポーネント側で行う必要があります
    */
   startRecording: () => {
      set({ status: 'recording', elapsedTime: 0 })
   },

   /**
    * 録音を停止します
    *
    * 録音状態を'completed'に設定します
    * すでに完了状態の場合は何も行いません
    */
   stopRecording: () => {
      set((state) => {
         // すでに完了状態の場合は何もしない
         if (state.status === 'completed') return state

         return { status: 'completed' }
      })
   },

   /**
    * 録音を一時停止します
    *
    * 録音状態を'paused'に設定します
    * 録音中の場合のみ一時停止可能です
    */
   pauseRecording: () => {
      set((state) => {
         // 録音中の場合のみ一時停止可能
         if (state.status !== 'recording') return state

         return { status: 'paused' }
      })
   },

   /**
    * 一時停止中の録音を再開します
    *
    * 録音状態を'recording'に戻します
    * 一時停止中の場合のみ再開可能です
    */
   resumeRecording: () => {
      set((state) => {
         // 一時停止中の場合のみ再開可能
         if (state.status !== 'paused') return state

         return { status: 'recording' }
      })
   },

   /**
    * 録音データと状態をリセットします
    *
    * 録音状態を'idle'に戻し、録音データと経過時間をクリアします
    * 新しい録音を開始する前に使用します
    */
   resetRecording: () => {
      set({
         status: 'idle',
         audioData: null,
         elapsedTime: 0,
      })
   },

   /**
    * 録音の経過時間を更新します
    *
    * 録音中のタイマー処理から定期的に呼び出されます
    *
    * @param time - 更新する経過時間（ミリ秒）
    */
   updateElapsedTime: (time: number) => {
      set({ elapsedTime: time })
   },

   /**
    * 録音データを設定します
    *
    * 録音完了時に生成された音声データを保存します
    *
    * @param data - 設定する音声データオブジェクト
    */
   setAudioData: (data: AudioData) => {
      set({ audioData: data })
   },
}))
