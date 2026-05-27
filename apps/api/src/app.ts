import { OpenAPIHono } from "@hono/zod-openapi"
import { logger as honoLogger } from "hono/logger"
import { requestId } from "hono/request-id"
import { timing } from "hono/timing"
import { getCorsMiddleware } from "./middleware/cors"
import { errorHandler } from "./middleware/error"
import { openApiDocumentConfig } from "./openapi-config"
import audioRoutes from "./routes/audio"
import { healthRoutes } from "./routes/health"
import pinsRoutes from "./routes/pins"
import type { Env } from "./types/env"
import { logger } from "./utils/logger"

/**
 * OpenAPIHono アプリケーションを構築する。
 */
export function createApp(): OpenAPIHono<{ Bindings: Env }> {
   const app = new OpenAPIHono<{ Bindings: Env }>()

   app.use("*", requestId())
   app.use("*", timing())
   app.use("*", honoLogger())
   app.use("*", errorHandler)

   app.use("*", async (c, next) => {
      const corsMiddleware = getCorsMiddleware(c.env)
      return corsMiddleware(c, next)
   })

   app.use("*", async (c, next) => {
      const start = Date.now()
      const method = c.req.method
      const url = new URL(c.req.url)

      logger.info("Request received", {
         requestId: c.get("requestId"),
         method,
         path: url.pathname,
         query: Object.fromEntries(url.searchParams),
         userAgent: c.req.header("user-agent"),
      })

      await next()

      const duration = Date.now() - start
      const status = c.res.status

      logger.info("Request completed", {
         requestId: c.get("requestId"),
         method,
         path: url.pathname,
         status,
         duration,
      })
   })

   app.get("/", (c) => {
      return c.json({
         success: true,
         data: {
            name: "Sonory API",
            version: "0.1.0",
            environment: c.env.ENVIRONMENT,
            timestamp: new Date().toISOString(),
         },
      })
   })

   app.route("/api/health", healthRoutes)
   app.route("/api/audio", audioRoutes)
   app.route("/api/pins", pinsRoutes)

   app.doc("/api/openapi.json", openApiDocumentConfig)

   app.get("/api/docs", (c) => {
      return c.html(`<!DOCTYPE html>
<html>
<head>
  <title>Sonory API Docs</title>
  <meta charset="utf-8"/>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" >
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"> </script>
  <script>
    SwaggerUIBundle({ url: "/api/openapi.json", dom_id: '#swagger-ui' })
  </script>
</body>
</html>`)
   })

   app.notFound((c) => {
      return c.json(
         {
            success: false,
            error: {
               code: "NOT_FOUND",
               message: "The requested resource was not found",
               timestamp: new Date().toISOString(),
               requestId: c.get("requestId"),
            },
         },
         404,
      )
   })

   return app
}

export const app = createApp()
