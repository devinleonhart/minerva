// test/api/ingredients/create.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import createRouter from '../../../src/routes/ingredients/create'
import { seed } from '../../db/seed'

const app = express()
app.use(express.json())
app.use('/api/ingredients', createRouter)

beforeEach(async () => {
  await seed()
})

describe('POST /api/ingredients', () => {
  it('creates a new ingredient when valid', async () => {
    const res = await request(app).post('/api/ingredients').send({
      name: 'Moonstone',
      description: 'Glowing mystical gem'
    })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.name).toBe('Moonstone')
  })

  it('returns 400 when name is missing', async () => {
    const res = await request(app).post('/api/ingredients').send({
      description: 'Missing name'
    })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Name and description are required.')
  })

  it('returns 400 when description is missing', async () => {
    const res = await request(app).post('/api/ingredients').send({
      name: 'Nameless'
    })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Name and description are required.')
  })
})
