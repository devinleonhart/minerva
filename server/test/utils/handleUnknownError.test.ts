import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { handleUnknownError } from '../../src/utils/handleUnknownError.js'
import type { Response } from 'express'

describe('handleUnknownError utility', () => {
  let mockRes: Partial<Response>
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    }
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('should log the error with action description', () => {
    const error = new Error('Test error')
    handleUnknownError(mockRes as Response, 'testing', error)

    expect(consoleSpy).toHaveBeenCalledWith('Error testing:', error)
  })

  it('should respond with 500 status', () => {
    handleUnknownError(mockRes as Response, 'testing', new Error('Test'))

    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it('should respond with internal server error message', () => {
    handleUnknownError(mockRes as Response, 'testing', new Error('Test'))

    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal server error' })
  })

  it('should handle non-Error objects', () => {
    const error = { custom: 'error object' }
    handleUnknownError(mockRes as Response, 'processing', error)

    expect(consoleSpy).toHaveBeenCalledWith('Error processing:', error)
    expect(mockRes.status).toHaveBeenCalledWith(500)
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal server error' })
  })

  it('should handle string errors', () => {
    handleUnknownError(mockRes as Response, 'saving', 'Something went wrong')

    expect(consoleSpy).toHaveBeenCalledWith('Error saving:', 'Something went wrong')
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it('should handle null/undefined errors', () => {
    handleUnknownError(mockRes as Response, 'deleting', null)
    expect(mockRes.status).toHaveBeenCalledWith(500)

    handleUnknownError(mockRes as Response, 'updating', undefined)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })
})
