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

  it('updates an ingredient via PUT', async () => {
    const updateData = { name: 'Updated Mint', description: 'Updated Fresh' }
    vi.mocked(axios.put).mockResolvedValue({})

    const store = useIngredientStore()
    await store.updateIngredient(1, updateData)

    expect(axios.put).toHaveBeenCalledWith('/api/ingredients/1', updateData)
  })

  it('handles update ingredient error', async () => {
    const updateData = { name: 'Updated Mint', description: 'Updated Fresh' }
    const error = new Error('Network error')
    vi.mocked(axios.put).mockRejectedValue(error)

    const store = useIngredientStore()

    await expect(store.updateIngredient(1, updateData)).rejects.toThrow('Network error')
    expect(axios.put).toHaveBeenCalledWith('/api/ingredients/1', updateData)
  })

  it('deletes an ingredient via DELETE', async () => {
    vi.mocked(axios.delete).mockResolvedValue({})

    const store = useIngredientStore()
    await store.deleteIngredient(1)

    expect(axios.delete).toHaveBeenCalledWith('/api/ingredients/1')
  })

  it('checks ingredient deletability', async () => {
    const mockDeletability = { canDelete: true, reason: null }
    vi.mocked(axios.get).mockResolvedValue({ data: mockDeletability })

    const store = useIngredientStore()
    const result = await store.checkIngredientDeletability(1)

    expect(result).toEqual(mockDeletability)
    expect(axios.get).toHaveBeenCalledWith('/api/ingredients/1/deletable')
  })

  it('toggles ingredient secured status', async () => {
    const mockGetIngredients = vi.fn().mockResolvedValue(undefined)
    vi.mocked(axios.put).mockResolvedValue({})
    vi.mocked(axios.get).mockResolvedValue({ data: [] })

    const store = useIngredientStore()
    store.getIngredients = mockGetIngredients

    await store.toggleSecured(1, true)

    expect(axios.put).toHaveBeenCalledWith('/api/ingredients/1', { secured: true })
    expect(mockGetIngredients).toHaveBeenCalled()
  })

  it('handles toggle secured error', async () => {
    const error = new Error('Network error')
    vi.mocked(axios.put).mockRejectedValue(error)

    const store = useIngredientStore()

    await expect(store.toggleSecured(1, false)).rejects.toThrow('Network error')
    expect(axios.put).toHaveBeenCalledWith('/api/ingredients/1', { secured: false })
  })
})
