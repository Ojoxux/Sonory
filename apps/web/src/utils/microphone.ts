/**
 * マイク権限の状態
 *
 * `requesting` のみブラウザではなく UI 側の状態。`unknown` は未要求か、
 * Permissions API 非対応で問い合わせられなかった場合。
 */
export type MicrophonePermissionState =
   | "unknown"
   | "requesting"
   | "granted"
   | "denied"

/**
 * マイクの使用許可を要求する
 *
 * 取得したストリームは即座に停止し、実際の録音は `useMediaRecorder` が
 * 改めて開き直す。
 *
 * @throws {DOMException} 拒否された場合（`name` は `NotAllowedError`）
 */
export async function requestMicrophonePermission(): Promise<void> {
   if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      throw new Error("このブラウザではマイクを利用できません")
   }

   const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
   for (const track of stream.getTracks()) {
      track.stop()
   }
}

/**
 * マイク権限の現在の状態を問い合わせる
 *
 * Permissions API の `microphone` は Chromium 系のみ。Safari / Firefox は
 * 実際に要求するまで分からないため `unknown` を返す。
 */
export async function getMicrophonePermissionState(): Promise<
   Exclude<MicrophonePermissionState, "requesting">
> {
   if (typeof navigator === "undefined" || !navigator.permissions) {
      return "unknown"
   }

   try {
      const status = await navigator.permissions.query({
         // TypeScript の PermissionName に microphone が含まれていない
         name: "microphone" as PermissionName,
      })
      return status.state === "prompt" ? "unknown" : status.state
   } catch {
      return "unknown"
   }
}
