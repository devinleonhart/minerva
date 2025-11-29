import express from 'express'
import cors from 'cors'
import routes from '../src/routes/index.js'

export function createTestApp() {
  const app = express()

  app.use(cors())
  app.use(express.json())
  app.use('/api', routes)

  return app
}
