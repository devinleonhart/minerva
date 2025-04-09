import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/vue'
import ExampleComponent from '../../src/components/ExampleComponent.vue'
import * as addModule from '../../src/utils/ingredient/add'

describe('ExampleComponent', () => {
  it('calls addIngredient with expected ingredient', () => {
    const spy = vi.spyOn(addModule, 'addIngredient')

    render(ExampleComponent)

    expect(spy).toHaveBeenCalledWith({
      name: 'Example Ingredient',
      description: 'This is an example ingredient.',
      secured: false
    })

    spy.mockRestore()
  })
})
