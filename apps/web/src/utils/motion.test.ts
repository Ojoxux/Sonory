import { describe, expect, test } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { DURATION, EASE_DRAWER, EASE_IN_OUT, EASE_OUT } from "./motion"

const css = readFileSync(resolve(__dirname, "../app/globals.css"), "utf8")

const readVar = (name: string): string => {
   const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`))
   if (!match?.[1]) throw new Error(`--${name} が globals.css に無い`)
   return match[1].trim()
}

describe("motion の値が globals.css の @theme と一致する", () => {
   test.each([
      ["ease-out", EASE_OUT],
      ["ease-in-out", EASE_IN_OUT],
      ["ease-drawer", EASE_DRAWER],
   ] as const)("%s", (name, curve) => {
      expect(readVar(name)).toBe(`cubic-bezier(${curve.join(", ")})`)
   })

   test.each(Object.entries(DURATION))("duration-%s", (name, seconds) => {
      expect(readVar(`transition-duration-${name}`)).toBe(
         `${Math.round(seconds * 1000)}ms`,
      )
   })
})
