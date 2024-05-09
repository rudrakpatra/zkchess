# Welcome to the next generation of Gaming using MINA !
This project primarily shows that it is possible to write game logic as *'complex'* as chess using Mina's [o1js](https://github.com/o1-labs/o1js/).

**Disclaimer:** This project is a part of the [Mina Navigator's Program](https://discord.com/channels/484437221055922177/1160881781055180800), primarily focused on understanding how Mina works.

# TLDR
### A zkprogram & smartcontract/zkApp to play chess.
1. Proves that every move is played correctly and the final result `win` ,`loose` ,`draw` (along with `draw_by_stalemate`),
2. Players may also create chess puzzles using a custom inital state of the Board. Potentially solve puzzles without revealing the solutions.

# UI demo 
hosted on [vercel](https://zkchess-ten.vercel.app/)

<img src="https://github.com/rudrakpatra/zkchess/assets/84844790/877962c0-a4ab-46cd-b0c1-50a818be0d6b" style="min-width:100%"/>

# Usage
1. Chess matches are verified onchain and player ratings can be trusted.
2. Create onchain chess puzzles.

# How it works?
Originally there was a single smart contract that does everything (checkout the `ChessContract` folder).

Now the functionalities are divided into a zkprogram namely `PvPChessProgram` and  smartcontract namely `PvPChessProgramSubmission`.

## PvPChessProgramSubmission
### 💡`submit(zkProgram:PvPChessProgram)`
1. accepts matches that have ended (won,lost,drawn,drawnByStalemate)
2. updates the elo ratings of the players accordingly.
   
## PvPChessProgram
### ✨ `start(whiteKey: PublicKey, blackKey: PublicKey)`
1. takes in the public keys of the white and black players.
2. starts the game with the initial starting positions (configurable).

### 🚚 `move(move:Move)`
1. verifies whether the current move is valid or not.
2. a `Move` consists of a path of size 8 and promotion choice.
3. finally updates the piece's position to the end of the path.

   ### How handling Draws and Stalemates Work
     If a player has no valid move to play and its king is not in check, then it's a stalemate and the game is a draw.
      Handling stalemates is tricky any normal approach would take enough time to be unfeasible.
      However, taking some reasonable compromises, we can greatly reduce it exponentially using a _interactive_ approach.
      Take a look at the [contract](https://github.com/rudrakpatra/zkchess/tree/gameloop/contracts#readme) for a more detailed explanation.
  
### 🤝 `offerDraw()`
1. the player calls this to offer a draw request.
2. this can only be called if the game is ongoing.

### 🤝 `resolveDraw()`
1. accept or reject the draw request.
2. can only be called when draw is offered. 

### 😖 `resign()`
1. the player calls this to resign.

Take a look at the [contract](https://github.com/rudrakpatra/zkchess/tree/gameloop/contracts#readme) for other methods that handles possible disputes.


## How does multiplayer work?
### Option 1 : Peer.js + Link sharing
Take a look at the example scenario of Alice and Bob playing a game of zkchess.

<img src="https://raw.githubusercontent.com/rudrakpatra/zkchess/10bbf77ddf629540902020d7b03de85e3b5586d4/multiplayer.svg" style="min-width:100%"/>
A few things to note:

1. Once a match is started the invite link is not longer valid.
2. If during the match if anyone leaves the page the game is stalled idefinitely (they cannot rejoin as of now).
3. If the Game Machine somehow receives an invalid proof, it simply ignores it expecting a valid version of that proof to come next.

### Option 2 : MatchMaker Server + Web Sockets for comms.
Please checkout branch `v0.1.4` -> server folder.

## Future Aspects
### Utilizing the ZK aspect with "Transcendental Chess"
Rethinking the possibilities of chess with this groundbreaking zk technology.
1. Chess pieces can move into different realms becoming invisible to the opponent (while still moving according to the rules).
2. Switch realms to evade enemy strikes and execute unexpected assaults.
3. With so many options checkmating may be difficult so may be the kings cannot shift realms when under check, uh we will think about that.

There is a lot of crazy ideas to think about.

# Contributing Is Easy
1. clone this repository 
2. go to contracts folder.
3. run `npm install` and then `npm run test` to test the contract.
4. run `npm run build` to build the contracts

5. go to ui folder.
6. run `npm install` and then `npm run dev` to run it on dev mode

# Video links
you can check out this [youtube video](https://youtu.be/4SH52WuMwkI) (last updated on Nov 1, 2023) 
