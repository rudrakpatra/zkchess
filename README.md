# Welcome to the next generation of Gaming using MINA !
I made this project primarily to understand how Mina works.

# TLDR
### A smartcontract/zkApp to play chess.
1. Proves that every move is played correctly and the final result `win` ,`loose` ,`draw` (along with `draw_by_stalemate`),
2. Players can also create chess puzzles using a custom inital state of the Board. Solve puzzles without revealing the solutions.

### UI demo 
Here is a video demo [watch video on youtube](https://youtu.be/5b8q2ik4Uo8)

<img src="https://github.com/rudrakpatra/zkchess/assets/84844790/8a2abdff-a65e-4644-bde4-936eb23f831c" style="min-width:100%"/>

# Usage
1. Chess matches are verified onchain and player ratings can be trusted.
2. Create onchain chess puzzles.

# How it works?
The smart contract has 4 methods.
### ✨ `start(whiteKey: PublicKey, blackKey: PublicKey)`
1. takes in the public keys of the white and black players.
2. starts the game with the initial starting positions (configurable).

### 🚚 `move(move:ChessMove)`
1. verifies whether the current move is valid or not.
2. a `ChessMove` consists of a path of size 8 and promotion choice.
3. finally updates the piece's position to the end of the path.

   ### How handling Draws and Stalemates Work
     If a player has no valid move to play and its king is not in check, then it's a stalemate and the game is a draw.
      Handling stalemates is tricky any normal approach would take enough time to be unfeasible.
      However ,taking some reasonable compromises, we can greatly reduce it exponentially using a _interactive_ approach.
      Take a look at the [readme](https://github.com/rudrakpatra/zkchess/tree/gameloop/contracts#readme) in the contracts folder for a more detailed explanation.
  
### 🤝 `draw()`
1. the player calls this to accept a draw request.
2. this can only be called if other player requested it / stalemate / 50 moves rule

### 😖 `resign()`
1. the player calls this to resign.

 Take a look at the [readme](https://github.com/rudrakpatra/zkchess/tree/gameloop/contracts#readme) in the contracts folder for other methods that handles possible disputes.

# Contributing Is Easy
clone this repository
go to contracts folder and run 
`npm install` and then `npm run test` to test the contract.

run `npm run build` to build the contracts

go to ui folder and run
`npm install` and then `npm run dev` to run it on dev mode

# Video links
you can check out this [youtube video](https://youtu.be/4SH52WuMwkI) (last updated on Nov 1, 2023) 
