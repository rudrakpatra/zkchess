import { Socket } from 'socket.io'
import { BST } from 'data-structure-typed'
import crypto from 'crypto'

type RoomId = string
type PlayerInfo = {
  entryTime: number
  publicKey: string
  proxyKey: string
  jsonSign: string
  socket: Socket
}
type GameInfo = {
  roomId: RoomId
  whitePlayer: PlayerInfo
  blackPlayer: PlayerInfo
}
const unmatchedPlayers = new BST<number, PlayerInfo>() // elo ratin => player info

const games = new Map<string, GameInfo>() // socket id => game info

export const startingThreshold = 40

/**
 * Events
 * find - to start finding a match
 * startGame - to start a game, sent to both players by server
 * move - to make a move, msg sent by 1 player, relayed to all other players
 * endGame - to end a game, sent by a player, relayed to all other players
 */
export const socketConnectionHandler = (socket: Socket) => {
  console.log('socket connected, id:', socket.id)

  socket.once(
    'find',
    (publicKey: string, proxyKey: string, jsonSign: string) => {
      console.log('finding match for', publicKey.substring(0, 7) + '...')
      // TODO find elo rating
      const elo = 1000 + Math.random() * 400
      unmatchedPlayers.add(elo, {
        entryTime: Date.now(),
        publicKey: publicKey,
        proxyKey: proxyKey,
        jsonSign: jsonSign,
        socket,
      })
    },
  )

  socket.on('disconnect', () => {
    console.log('socket disconnected, id:', socket.id)
    const gameInfo = games.get(socket.id)
    if (!gameInfo) return
    const { whitePlayer, blackPlayer } = gameInfo
    // send a endGame event to all rooms
    ;[
      // in white player's rooms
      ...whitePlayer.socket.rooms,
      // and in black player's rooms
      ...blackPlayer.socket.rooms,
    ].forEach((room) => {
      socket.to(room).emit('endGame')
      games.delete(socket.id)
    })
  })
}

// a job that runs every 10s to match players
setInterval(() => {
  console.log('job running')
  // @ts-ignore
  let players: [number, PlayerInfo][] = Array.from(
    unmatchedPlayers.entries(),
  ).filter((p) => {
    if (p[1] === undefined) return false
    return p[1].socket.connected
  })
  //   console.log('players:', players)
  console.log(
    'current unmatchedPlayers',
    Array.from(unmatchedPlayers.entries()).map((p) => p[1]?.publicKey),
  )
  if (players.length < 2) return

  let remainingPlayers: [number, PlayerInfo][] = []
  let i
  for (i = 0; i < players.length - 1; i++) {
    const player0 = players[i]
    const player1 = players[i + 1]
    // threshold increase as time goes by
    const player0Threshold =
      (400 * (Date.now() - player0[1].entryTime)) / (10 * 1000) +
      startingThreshold
    // if player0 and player1 elo rating < threshold then match
    if (Math.abs(player0[0] - player1[0]) < player0Threshold) {
      console.log('matched', player0[1].publicKey, player1[1].publicKey)
      startGame(player0[1], player1[1])
      i++ // skip player1
    } else {
      remainingPlayers.push(player0)
    }
  }
  if (i === players.length - 1) {
    remainingPlayers.push(players[players.length - 1])
  }
  // update unmatchedPlayers BST if some games started this round

  unmatchedPlayers.clear()
  unmatchedPlayers.addMany(remainingPlayers)
  console.log(
    'updated unmatchedPlayers',
    Array.from(unmatchedPlayers.entries()).map((p) => p[1]?.publicKey),
  )
}, 10000)

function startGame(player0: PlayerInfo, player1: PlayerInfo) {
  const roomId = crypto.randomBytes(8).toString('hex')
  console.log('game started', roomId)
  // both players join a socket room
  player0.socket.join(roomId)
  player1.socket.join(roomId)

  const gameInfo: GameInfo = {
    roomId,
    whitePlayer: player0,
    blackPlayer: player1,
  }
  games.set(player0.socket.id, gameInfo)
  games.set(player1.socket.id, gameInfo)

  // setup relays for move events
  player0.socket.on('move', (msg) =>
    player0.socket.to(gameInfo.roomId).emit('move', msg),
  )
  player1.socket.on('move', (msg) =>
    player1.socket.to(gameInfo.roomId).emit('move', msg),
  )
  // notify players
  player0.socket.emit('startGame', {
    roomId,
    playAsBlack: false,
    opponent: {
      publicKey: player1.publicKey,
      proxyKey: player1.proxyKey,
      jsonSign: player1.jsonSign,
    },
  })
  player1.socket.emit('startGame', {
    roomId,
    playAsBlack: true,
    opponent: {
      publicKey: player0.publicKey,
      proxyKey: player0.proxyKey,
      jsonSign: player0.jsonSign,
    },
  })
}
