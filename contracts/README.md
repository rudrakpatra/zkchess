# zkchess-contracts

```sh
npm i zkchess-contracts
```

This contract is an **interactive** version of game-verification.

This contract assumes that atleast **one** of the players is honest to gurantee that the games are played correctly.

Check out the **contractv2** branch for the **non-interactive** version of the contract which does not assume honesty of any player.

## Why interactive?

To fully verify the game like in **contractv2**, we have to generate all possible moves and verify each move.

With Interactive Proofs the players prove facts by providing evidence to the contract.

Some tricky situations handled are:

1. ### invalid king castling
   king passes through an attacked square while castling.
2. ### stalemate
   when a player is not in check but has no legal moves.

## How to run tests

```sh
npm run test
npm run testw # watch mode
```

## How to run coverage

```sh
npm run coverage
```

## License

[Apache-2.0](LICENSE)
