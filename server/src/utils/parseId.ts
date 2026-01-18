import type { Request } from 'express'

export function parseId(
  req: Request,
): number | null {
  const idString = req.params['id']

  // Check for obviously invalid formats
  if (!idString || idString.trim() === '' || idString.includes('.') || idString.startsWith('-')) {
    return null
  }

  // Check if it's a pure integer string (no letters, special chars, etc.)
  if (!/^\d+$/.test(idString.trim())) {
    return null
  }

  const id = parseInt(idString, 10)
  if (isNaN(id) || id <= 0 || id > 2147483647) { // Max 32-bit integer
    return null
  }
  return id
}
