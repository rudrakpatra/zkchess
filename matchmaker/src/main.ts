import express, { Application, Response, Request, NextFunction } from 'express'
import env from 'dotenv'
import { Home } from './routes'
import cors from 'cors'

//.env
env.config()

//express
const app: Application = express()

const PORT = process.env.PORT || 1337
const SERVER_URL = process.env.SERVER_URL || 'http://localhost'
app.use(cors())
app.use('/', Home)

app.listen(PORT, () => {
  console.info(`Service starting at ${SERVER_URL}:${PORT}`)
})
