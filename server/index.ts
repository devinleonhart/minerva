import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import pkg from 'pg'

dotenv.config()
const { Pool } = pkg

const app = express()
app.use(cors())
app.use(express.json())

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

app.get('/api/data', async (req, res) => {
  const result = await pool.query('SELECT * FROM your_table')
  res.json(result.rows)
})

app.listen(3000, () => console.log('API server running on port 3000'))
