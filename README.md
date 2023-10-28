# Welcome to the next generation of Gaming using MINA !
I made this project primarily to understand how Mina works.

# TLDR
### A smartcontract/zkApp to play chess.
1. Proves that every move is played correctly and the final result win,loose,draw.
2. Players can also create chess puzzles using a custom inital state of the Board.
### A simple UI demo


# Usage
1. Chess matches are verified onchain and player ratings can be trusted.
2. Create onchain chess puzzles.

# How it works?
The smart contract has 4 methods.
### ✨ `start(whiteKey: PublicKey, blackKey: PublicKey)`
1. takes in the public keys of the white and black players.
2. starts the game with the initial starting positions (configurable).

### 🚚 `move(id: UInt32, path: Position[], newRank:Field)`
1. verifies whether the current move is valid or not.
2. the id refers to the piece index to be moved.
3. the path is an ordered list of all positions/squares the piece passes through while moving.
4. newRank is used for promoting a pawn to knight/bishop/rook/queen.
5. finally updates the piece's position to the end of the path.

   ### A possible way of handling Draws and Stalemates
     If a player has no valid move to play and its king is not in check, then it's a stalemate and the game is a draw.
     
     For this, a move will also take a `possibleNextMove` of the other player which proves that a stalement cannot occur.
      
     ```
     type Move={id: UInt32, path: Position[], newRank:Field}
     move(myMove:Move, possibleNextMove:Move, offerDraw:Bool )
     
     if (offerDraw is true)
     //then we simply allow the next player to accept draw on the next turn.
   
     else if (possibleNextMove is invalid)
     //then there is a chance of stalemate allowing the next player to accept the draw.
      ```
  
### 🤝 `draw()`
1. the player calls this to accept a draw request.
2. this can only be called if other player has requested to draw (as mentioned in move).

### 😖 `resign()`
1. the player calls this to resign.
