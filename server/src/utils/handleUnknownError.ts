import type { Response } from 'express'

export function handleUnknownError(
  res: Response,
  action: string,
  error: unknown,
): void {
  console.error(`Error ${action}:`, error)
  res.status(500).json({ error: 'Internal server error' })
}
