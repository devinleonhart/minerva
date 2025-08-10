import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import axios from 'axios'
import { useIngredientStore, toIngredientCreateInput } from '../../src/store/ingredient'

vi.mock('axios')

describe('Ingredient Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  it('fetches ingredients and sets state', async () => {
    const mockIngredients = [
      { id: 1, name: 'Test', description: 'Desc' }
    ]
    vi.mocked(axios.get).mockResolvedValue({ data: mockIngredients })

    const store = useIngredientStore()
    await store.getIngredients()

    expect(store.ingredients).toEqual(mockIngredients)
    expect(axios.get).toHaveBeenCalledWith('/api/ingredients/')
  })

  it('adds an ingredient via POST', async () => {
    const form = { name: 'Mint', description: 'Fresh' }
    vi.mocked(axios.post).mockResolvedValue({})

    const store = useIngredientStore()
    await store.addIngredient(form)

    expect(axios.post).toHaveBeenCalledWith(
      '/api/ingredients/',
      toIngredientCreateInput(form)
    )
  })
})
