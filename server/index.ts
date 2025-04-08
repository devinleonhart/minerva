import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const serverPort = 3000

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const clientDist = path.resolve(__dirname, '../../dist/client')

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static(clientDist))

app.get('/api/data', async (req, res) => {
  const mockData = [
    { id: 1, name: 'Dragon Scale', description: 'Rare and magical scale.', secured: true },
    { id: 2, name: 'Phoenix Feather', description: 'Fiery feather of rebirth.', secured: false },
    { id: 3, name: 'Unicorn Fur', description: 'Purity crystalized.', secured: true }
  ]
  res.json(mockData)
})

app.use((req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'))
})

app.listen(serverPort, () => console.log(`Serving magic from port ${serverPort}!`))
