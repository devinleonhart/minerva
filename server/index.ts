import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import routes from './src/routes/index'

const serverPort = 3000

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const clientDist = path.resolve(__dirname, '../../dist/client')

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static(clientDist))
app.use('/api', routes)

app.use((req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'))
})

app.listen(serverPort, () => console.log(`Serving magic from port ${serverPort}!`))
