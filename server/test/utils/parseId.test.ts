import { describe, it, expect } from 'vitest'
import { parseId } from '../../src/utils/parseId.js'
import type { Request } from 'express'

// Helper to create a mock request with params
function mockRequest(params: Record<string, string>): Request {
  return { params } as Request
}

describe('parseId utility', () => {
  describe('valid IDs', () => {
    it('should parse a valid positive integer ID', () => {
      const req = mockRequest({ id: '123' })
      expect(parseId(req)).toBe(123)
    })

    it('should parse ID of 1', () => {
      const req = mockRequest({ id: '1' })
      expect(parseId(req)).toBe(1)
    })

    it('should parse large valid ID', () => {
      const req = mockRequest({ id: '2147483647' })
      expect(parseId(req)).toBe(2147483647)
    })

    it('should handle ID with leading/trailing whitespace', () => {
      const req = mockRequest({ id: ' 42 ' })
      expect(parseId(req)).toBe(42)
    })
  })

  describe('invalid IDs', () => {
    it('should return null for missing id param', () => {
      const req = mockRequest({})
      expect(parseId(req)).toBeNull()
    })

    it('should return null for empty string', () => {
      const req = mockRequest({ id: '' })
      expect(parseId(req)).toBeNull()
    })

    it('should return null for whitespace-only string', () => {
      const req = mockRequest({ id: '   ' })
      expect(parseId(req)).toBeNull()
    })

    it('should return null for negative number', () => {
      const req = mockRequest({ id: '-1' })
      expect(parseId(req)).toBeNull()
    })

    it('should return null for zero', () => {
      const req = mockRequest({ id: '0' })
      expect(parseId(req)).toBeNull()
    })

    it('should return null for decimal number', () => {
      const req = mockRequest({ id: '1.5' })
      expect(parseId(req)).toBeNull()
    })

    it('should return null for non-numeric string', () => {
      const req = mockRequest({ id: 'abc' })
      expect(parseId(req)).toBeNull()
    })

    it('should return null for mixed alphanumeric', () => {
      const req = mockRequest({ id: '123abc' })
      expect(parseId(req)).toBeNull()
    })

    it('should return null for ID exceeding 32-bit integer max', () => {
      const req = mockRequest({ id: '2147483648' })
      expect(parseId(req)).toBeNull()
    })

    it('should return null for special characters', () => {
      const req = mockRequest({ id: '12@34' })
      expect(parseId(req)).toBeNull()
    })

    it('should return null for scientific notation', () => {
      const req = mockRequest({ id: '1e5' })
      expect(parseId(req)).toBeNull()
    })
  })
})
