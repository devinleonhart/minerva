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

  app.get('/{*splat}', (req, res) => {
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
