import type { Request, Response } from 'express'

export function parseId(
  req: Request,
  res: Response,
  param: string = 'id'
): number | null {
  const id = parseInt(req.params[param], 10)
  if (isNaN(id)) {
    res.status(400).json({ error: `Invalid ${param}` })
    return null
  }
  return id
}
