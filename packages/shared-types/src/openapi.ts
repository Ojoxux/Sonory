import type { HonoApiPaths } from "./generated/index.js"

type JsonContent<Response> = Response extends {
   content: { "application/json": infer Json }
}
   ? Json
   : never

type JsonRequestBody<Operation> = Operation extends {
   requestBody: { content: { "application/json": infer Body } }
}
   ? Body
   : never

type FormRequestBody<Operation> = Operation extends {
   requestBody: { content: { "multipart/form-data": infer Body } }
}
   ? Body
   : never

export type HonoJsonResponse<
   Path extends keyof HonoApiPaths,
   Method extends keyof HonoApiPaths[Path],
   Status extends PropertyKey = 200,
> = HonoApiPaths[Path][Method] extends { responses: infer Responses }
   ? Status extends keyof Responses
      ? JsonContent<Responses[Status]>
      : never
   : never

export type HonoJsonRequestBody<
   Path extends keyof HonoApiPaths,
   Method extends keyof HonoApiPaths[Path],
> = JsonRequestBody<HonoApiPaths[Path][Method]>

export type HonoFormRequestBody<
   Path extends keyof HonoApiPaths,
   Method extends keyof HonoApiPaths[Path],
> = FormRequestBody<HonoApiPaths[Path][Method]>

export type CreatePinResponse = HonoJsonResponse<"/api/pins", "post">
export type UploadPinResponse = HonoJsonResponse<"/api/pins/upload", "post">
export type NearbyPinsResponse = HonoJsonResponse<"/api/pins/nearby", "get">
export type DeletePinResponse = HonoJsonResponse<"/api/pins/{id}", "delete">
export type HonoSoundPin = CreatePinResponse["data"]
export type NearbyPin = NearbyPinsResponse["data"][number]

export type CreatePinRequestBody = HonoJsonRequestBody<"/api/pins", "post">
export type UploadAudioResponse = HonoJsonResponse<"/api/audio/upload", "post">
export type SubmitAnalysisJobResponse = HonoJsonResponse<
   "/api/audio/{audioId}/analyze",
   "post"
>
export type AnalysisStatusResponse = HonoJsonResponse<
   "/api/audio/{audioId}/analysis/{jobId}/status",
   "get"
>
export type AnalysisStatusData = AnalysisStatusResponse["data"]
