import { describe, it, expect, vi } from 'vitest'
import { parseId } from '../../src/utils/parseId'
import type { Request, Response } from 'express'

describe('parseId', () => {
  const mockResponse = () => {
    const res = {} as Response
    res.status = vi.fn().mockReturnValue(res)
    res.json = vi.fn().mockReturnValue(res)
    return res
  }

  it('returns a valid number if the param is numeric', () => {
    const req = { params: { id: '42' } } as unknown as Request
    const res = mockResponse()

    const result = parseId(req)
    expect(result).toBe(42)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('returns null if param is invalid', () => {
    const req = { params: { id: 'abc' } } as unknown as Request

    const result = parseId(req)
    expect(result).toBeNull()
  })
})
