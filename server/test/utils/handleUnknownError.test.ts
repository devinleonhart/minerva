import { describe, it, expect, vi } from 'vitest'
import { handleUnknownError } from '../../src/utils/handleUnknownError'
import type { Response } from 'express'

describe('handleUnknownError', () => {
  const mockResponse = () => {
    const res = {} as Response
    res.status = vi.fn().mockReturnValue(res)
    res.json = vi.fn().mockReturnValue(res)
    return res
  }

  it('logs the error and responds with 500', () => {
    const res = mockResponse()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const error = new Error('Something went wrong')
    handleUnknownError(res, 'testing error handler', error)

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error testing error handler:',
      error
    )
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' })

    consoleSpy.mockRestore()
  })
})
