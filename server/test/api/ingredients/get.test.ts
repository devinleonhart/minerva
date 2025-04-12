import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import ingredientsRouter from '../../../src/routes/ingredients'
import { seed } from '../../db/seed'

// Set up test app
const app = express()
app.use(express.json())
app.use('/api/ingredients', ingredientsRouter)

beforeEach(async () => {
  await seed()
})

describe('GET /api/ingredients', () => {
  it('returns all seeded ingredients', async () => {
    const res = await request(app).get('/api/ingredients')

    expect(res.status).toBe(200)
    expect(res.body.length).toBe(3)
    expect(res.body[0]).toHaveProperty('name')
    expect(res.body[0]).toHaveProperty('description')
  })
})

describe('GET /api/ingredients/:id', () => {
  it('returns a specific ingredient by ID', async () => {
    const res = await request(app).get('/api/ingredients/1')

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Dragon Scale')
  })

  it('returns 404 if ingredient is not found', async () => {
    const res = await request(app).get('/api/ingredients/999')

    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Ingredient not found')
  })

  it('returns 400 for invalid ID', async () => {
    const res = await request(app).get('/api/ingredients/invalid')

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Invalid ingredient ID')
  })
})
