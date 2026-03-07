import type { H3Event } from 'h3'
import { setResponseStatus } from 'h3'

export function handleUnknownError(event: H3Event, action: string, error: unknown) {
  console.error(`Error ${action}:`, error)
  setResponseStatus(event, 500)
  return { error: 'Internal server error' }
}
