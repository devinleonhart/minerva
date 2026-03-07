import { defineEventHandler } from 'h3'
import type { IncomingMessage } from 'node:http'

// h3 v2's readBody calls event.req.text() and event.req.headers.get(), which are
// Web Request API methods. Nuxt 4's Node.js adapter sets event.req to a Node.js
// IncomingMessage (no .text(), plain object headers). This middleware polyfills both
// so the route handlers work correctly in production.
export default defineEventHandler((event) => {
  const req = event.node?.req as IncomingMessage & {
    text?: () => Promise<string>
  }

  if (!req) return

  if (typeof req.text !== 'function') {
    let cached: Promise<string> | null = null
    req.text = () => {
      if (!cached) {
        cached = new Promise<string>((resolve, reject) => {
          const chunks: Buffer[] = []
          req.on('data', (chunk: Buffer) => chunks.push(chunk))
          req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
          req.on('error', reject)
        })
      }
      return cached
    }
  }

  const headers = req.headers as Record<string, string | string[] | undefined> & {
    get?: (name: string) => string | null
  }

  if (typeof headers.get !== 'function') {
    headers.get = (name: string) => {
      const value = headers[name.toLowerCase()]
      if (Array.isArray(value)) return value[0] ?? null
      return value ?? null
    }
  }
})
