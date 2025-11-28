import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import routes from './src/routes/index.js'

const app = express()
const serverPort = process.env.PORT || 3000

const __dirname = path.dirname(fileURLToPath(import.meta.url))

app.use(cors())
app.use(express.json())

app.use('/api', routes)

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client')))

  // Catch-all handler: serve index.html for any non-API routes
  // This must be last to allow static files and API routes to be handled first
  // Express 5 uses a different syntax for catch-all routes
  app.use((req, res, next) => {
    // Don't serve index.html for API routes or static assets
    if (req.path.startsWith('/api') || req.path.includes('.')) {
      return next()
    }
    res.sendFile(path.join(__dirname, '..', 'client', 'index.html'))
  })
}

app.listen(serverPort, (error) => {
  if (error) {
    console.error('Server failed to start:', error)
    process.exit(1)
    return
  }
  console.log(`Server started on port ${serverPort}`)
  console.log(`API available at http://localhost:${serverPort}/api`)
})
