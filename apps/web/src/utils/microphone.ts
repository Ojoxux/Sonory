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
 * マイクの使用許可を要求し、開いたストリームを返す
 *
 * @description
 * **返したストリームは止めずに録音へ渡すこと。** Firefox は「このデバイスを記憶する」を
 * 選ばない限り許可を保存しないため、ここで止めると録音開始時にもう一度ダイアログが出る。
 * 使わなくなったら `stopStream` で止める
 *
 * @throws {DOMException} 拒否された場合（`name` は `NotAllowedError`）
 */
export async function requestMicrophoneStream(): Promise<MediaStream> {
   if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      throw new Error("このブラウザではマイクを利用できません")
   }

   return navigator.mediaDevices.getUserMedia({ audio: true })
}

/** まだ音声を取れるストリームか */
export function isStreamLive(
   stream: MediaStream | null,
): stream is MediaStream {
   return (
      stream !== null &&
      stream.getAudioTracks().some((track) => track.readyState === "live")
   )
}

/** ストリームを止める。マイクの使用中表示もここで消える */
export function stopStream(stream: MediaStream | null): void {
   if (!stream) return
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
