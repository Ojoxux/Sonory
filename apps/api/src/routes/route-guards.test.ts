import { describe, expect, it } from "vitest"

/**
 * ルート定義ファイルの中身をビルド時に文字列として取り込む。
 * vitest の environment は miniflare のため node:fs は使えない。
 */
const sources = import.meta.glob("./*.ts", {
   query: "?raw",
   import: "default",
   eager: true,
}) as Record<string, string>

/** 認証もレート制限も課さないファイル。監視用途のため意図的に開けている */
const EXEMPT_FILES = ["./health.ts"]

/** 書き込み系とみなすメソッド */
const WRITE_METHODS = ["post", "put", "delete", "patch"]

/** 書き込み系に必要なガード（いずれか1つ） */
const WRITE_GUARDS = ["requireAuth", "requireInternalDispatch"]

interface RouteBlock {
   file: string
   name: string
   body: string
}

function collectRoutes(): RouteBlock[] {
   const routes: RouteBlock[] = []

   for (const [file, source] of Object.entries(sources)) {
      if (file.endsWith(".test.ts") || EXEMPT_FILES.includes(file)) {
         continue
      }

      const pattern = /const (\w+) = createRoute\(\{([\s\S]*?)\n\}\)/g
      let match = pattern.exec(source)

      while (match !== null) {
         routes.push({
            file,
            name: match[1] as string,
            body: match[2] as string,
         })
         match = pattern.exec(source)
      }
   }

   return routes
}

const routes = collectRoutes()

describe("ルートのガード宣言", () => {
   it("ルートを1つ以上検出できている", () => {
      expect(routes.length).toBeGreaterThan(0)
   })

   it.each(routes.map((r) => [`${r.file} ${r.name}`, r] as const))(
      "%s に middleware が宣言されている",
      (_label, route) => {
         expect(route.body).toContain("middleware:")
      },
   )

   it.each(
      routes
         .filter((r) =>
            WRITE_METHODS.some((m) => r.body.includes(`method: "${m}"`)),
         )
         .map((r) => [`${r.file} ${r.name}`, r] as const),
   )("%s（書き込み系）に認証ガードがある", (_label, route) => {
      const hasGuard = WRITE_GUARDS.some((g) => route.body.includes(g))
      expect(hasGuard).toBe(true)
   })
})
