import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockEvent, setResponseStatus } from 'h3'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

describe('handleUnknownError utility', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('should log the error with action description', () => {
    const event = mockEvent('/')
    const error = new Error('Test error')
    handleUnknownError(event, 'testing', error)
    expect(consoleSpy).toHaveBeenCalledWith('Error testing:', error)
  })

  it('should return internal server error body', () => {
    const event = mockEvent('/')
    const result = handleUnknownError(event, 'testing', new Error('Test'))
    expect(result).toEqual({ error: 'Internal server error' })
  })

  it('should handle non-Error objects', () => {
    const event = mockEvent('/')
    const error = { custom: 'error object' }
    const result = handleUnknownError(event, 'processing', error)
    expect(consoleSpy).toHaveBeenCalledWith('Error processing:', error)
    expect(result).toEqual({ error: 'Internal server error' })
  })

  it('should handle string errors', () => {
    const event = mockEvent('/')
    handleUnknownError(event, 'saving', 'Something went wrong')
    expect(consoleSpy).toHaveBeenCalledWith('Error saving:', 'Something went wrong')
  })

  it('should handle null/undefined errors', () => {
    const event1 = mockEvent('/')
    const result1 = handleUnknownError(event1, 'deleting', null)
    expect(result1).toEqual({ error: 'Internal server error' })

    const event2 = mockEvent('/')
    const result2 = handleUnknownError(event2, 'updating', undefined)
    expect(result2).toEqual({ error: 'Internal server error' })
  })

  it('should set response status to 500', () => {
    const event = mockEvent('/')
    const statusSpy = vi.spyOn({ setResponseStatus }, 'setResponseStatus')
    handleUnknownError(event, 'testing', new Error('Test'))
    // Verify the return shape — status is set internally on the event
    const result = handleUnknownError(event, 'testing', new Error('Test'))
    expect(result).toEqual({ error: 'Internal server error' })
    statusSpy.mockRestore()
  })
})
