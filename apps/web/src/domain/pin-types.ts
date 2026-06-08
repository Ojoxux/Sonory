import type {
   CreatePinResponse,
   HonoSoundPin,
   UploadPinResponse,
} from "@sonory/shared-types"

/**
 * ピン作成APIレスポンスの型
 */
export type PinApiResponse = CreatePinResponse | UploadPinResponse

/**
 * DBから取得したピンの型
 */
export type DbPin = HonoSoundPin
