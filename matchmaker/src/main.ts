import express, { Application, Response, Request, NextFunction } from 'express'
import { Server } from 'socket.io'
import { createServer } from 'http'
import cors from 'cors'
import { socketConnectionHandler as handleSocketConnection } from './webSocket'

//express
const app: Application = express()

const PORT = 8080
const SERVER_URL = 'http://localhost'
app.use(cors())
app.get('/', (req: Request, res: Response) => {
  res.status(200).send('health check')
})

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
io.on('connection', handleSocketConnection)
