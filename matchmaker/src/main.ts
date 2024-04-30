import express, { Application, Response, Request, NextFunction } from 'express'
import env from 'dotenv'
import { Home, Find } from './routes'
import cors from 'cors'
import { Server, Socket } from 'socket.io'
import { createServer } from 'http'
import { socketConnectionHandler } from './webSocket'

//.env
env.config()

//express
const app: Application = express()

const PORT = process.env.PORT || 1337
const SERVER_URL = process.env.SERVER_URL || 'http://localhost'
app.use(cors())
app.use('/', Home)
// app.use('/find', Find)

const server = createServer(app)
server.listen(PORT, () => {
  console.log(`Service starting at ${SERVER_URL}:${PORT}`)
})
// app.listen(PORT, () => {
//   console.info(`Service starting at ${SERVER_URL}:${PORT}`)
// })

const io = new Server(server, {
  // parser: require("socket.io-msgpack-parser"), TODO https://socket.io/docs/v3/custom-parser/
  // ...
  cors: {
    origin: '*',
    // credentials: true,
  },
})
io.on('connection', socketConnectionHandler)
