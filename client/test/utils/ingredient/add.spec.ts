import { describe, it, expect, vi } from 'vitest'
import { addIngredient } from '../../../src/utils/ingredient/add'
import type { Ingredient } from '../../../types/alchemy'

describe('addIngredient', () => {
  it('logs the correct message', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const ingredient: Ingredient = {
      name: 'Test Ingredient',
      description: 'Just for testing',
      secured: true
    }

    addIngredient(ingredient)

    expect(consoleSpy).toHaveBeenCalledWith('Adding ingredient:', 'Test Ingredient')

    consoleSpy.mockRestore()
  })
})
