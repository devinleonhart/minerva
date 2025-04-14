import type { Request } from 'express'

export function parseId(
  req: Request,
): number | null {
  const id = parseInt(req.params['id'], 10)
  if (isNaN(id)) {
    return null
  }
  return id
}
