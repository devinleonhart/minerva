import { describe, it, expect } from 'vitest'

function sum(a: number, b: number): number {
  return a + b
}

describe('sum', () => {
  it('adds numbers correctly', () => {
    expect(sum(2, 3)).toBe(5)
  })
})
