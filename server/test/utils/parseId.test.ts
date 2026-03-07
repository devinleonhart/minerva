import { describe, it, expect } from 'vitest'
import { parseId } from '../../utils/parseId.js'

describe('parseId utility', () => {
  describe('valid IDs', () => {
    it('should parse a valid positive integer ID', () => {
      expect(parseId('123')).toBe(123)
    })

    it('should parse ID of 1', () => {
      expect(parseId('1')).toBe(1)
    })

    it('should parse large valid ID', () => {
      expect(parseId('2147483647')).toBe(2147483647)
    })

    it('should handle ID with leading/trailing whitespace', () => {
      expect(parseId(' 42 ')).toBe(42)
    })
  })

  describe('invalid IDs', () => {
    it('should return null for undefined', () => {
      expect(parseId(undefined)).toBeNull()
    })

    it('should return null for empty string', () => {
      expect(parseId('')).toBeNull()
    })

    it('should return null for whitespace-only string', () => {
      expect(parseId('   ')).toBeNull()
    })

    it('should return null for negative number', () => {
      expect(parseId('-1')).toBeNull()
    })

    it('should return null for zero', () => {
      expect(parseId('0')).toBeNull()
    })

    it('should return null for decimal number', () => {
      expect(parseId('1.5')).toBeNull()
    })

    it('should return null for non-numeric string', () => {
      expect(parseId('abc')).toBeNull()
    })

    it('should return null for mixed alphanumeric', () => {
      expect(parseId('123abc')).toBeNull()
    })

    it('should return null for ID exceeding 32-bit integer max', () => {
      expect(parseId('2147483648')).toBeNull()
    })

    it('should return null for special characters', () => {
      expect(parseId('12@34')).toBeNull()
    })

    it('should return null for scientific notation', () => {
      expect(parseId('1e5')).toBeNull()
    })
  })
})
