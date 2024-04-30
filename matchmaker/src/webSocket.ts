import { Socket } from 'socket.io'
import { BST, BSTNode } from 'data-structure-typed'

type PlayerInfo = { entryTime: number; publicKey: string; socket: Socket }
const unmatchedPlayers = new BST<number, PlayerInfo>() // elo ratin => player info
const games = new Map<
  string,
  {
    whitePlayer: PlayerInfo
    blackPlayer: PlayerInfo
  }
>() // game room id => game info

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

  socket.on('find', (msg: { publicKey: string }) => {
    console.log('finding match for', msg.publicKey.substring(0, 7) + '...')
    // TODO find elo rating
    const elo = 1000 + Math.random() * 400
    unmatchedPlayers.add(elo, {
      entryTime: Date.now(),
      publicKey: msg.publicKey,
      socket,
    })
  })

  socket.on('disconnect', () => {
    console.log('socket disconnected, id:', socket.id)
    // no need to remove player from unmatchedPlayers, handled by job
    // if player (not viewer) already in a game, end the game, notify other players
    socket.rooms.forEach((room) => {
      if (room == socket.id) return

      socket.to(room).emit('endGame')
      // remove from games
      games.delete(room)
    })
  })
}

// a job that runs every 10s to match players
setInterval(() => {
  // @ts-ignore
  let players: [number, PlayerInfo][] = Array.from(
    unmatchedPlayers.entries(),
  ).filter((p) => {
    if (p[1] === undefined) return false
    return p[1].socket.connected
  })
  //   console.log('players:', players)

  if (players.length < 2) return

  let remainingPlayers: [number, PlayerInfo][] = []
  for (let i = 0; i < players.length - 1; i++) {
    const player0 = players[i]
    const player1 = players[i + 1]
    // threshold increase as time goes by
    const player0Threshold =
      (400 * (Date.now() - player0[1].entryTime)) / (10 * 1000) +
      startingThreshold
    // if player0 and player1 elo rating < threshold then match
    if (Math.abs(player0[0] - player1[0]) < player0Threshold) {
      startGame(player0[1], player1[1])
    } else {
      remainingPlayers.push(player0)
    }
  }

  // update unmatchedPlayers BST if some games started this round
  unmatchedPlayers.clear()
  console.log('unmatchedPlayers', unmatchedPlayers.values())
  unmatchedPlayers.addMany(remainingPlayers)
  console.log('unmatchedPlayers', unmatchedPlayers.values())
}, 10000)

function startGame(player0: PlayerInfo, player1: PlayerInfo) {
  const gameID = Math.random().toString(36).substring(10)
  games.set(gameID, {
    whitePlayer: player0,
    blackPlayer: player1,
  })
  // both players join a socket room
  player0.socket.join(gameID)
  player1.socket.join(gameID)
  // setup relayer
  player0.socket.on('move', (msg) => {
    player0.socket.to(gameID).emit('move', msg)
  })
  player1.socket.on('move', (msg) => {
    player1.socket.to(gameID).emit('move', msg)
  })
  // notify players
  player0.socket.emit('startGame', { gameID, side: 'white' })
  player1.socket.emit('startGame', { gameID, side: 'black' })
}
