import { AccountUpdate, Field, Mina, PrivateKey, PublicKey } from 'o1js';

import { Chess } from './Chess.js';
import { Move } from './Move/Move.js';
import { RANK } from './Piece/Rank.js';

const proofsEnabled = false;
describe('Chess.ts', () => {
  let deployerAccount: PublicKey,
    deployerKey: PrivateKey,
    whitePlayerAccount: PublicKey,
    whitePlayerKey: PrivateKey,
    blackPlayerAccount: PublicKey,
    blackPlayerKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: Chess;

  beforeAll(async () => {
    if (proofsEnabled) await Chess.compile();
  });

  beforeEach(() => {
    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    ({ privateKey: deployerKey, publicKey: deployerAccount } =
      Local.testAccounts[0]);
    ({ privateKey: whitePlayerKey, publicKey: whitePlayerAccount } =
      Local.testAccounts[1]);
    ({ privateKey: blackPlayerKey, publicKey: blackPlayerAccount } =
      Local.testAccounts[2]);
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new Chess(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.deploy();
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('starts the game and resigns', async () => {
    await localDeploy();
    const txn = await Mina.transaction(whitePlayerAccount, () => {
      zkApp.start(whitePlayerAccount, blackPlayerAccount);
    });
    await txn.prove();
    await txn.sign([whitePlayerKey]).send();
    console.log(zkApp.getGameState().toFEN());
    const txn2 = await Mina.transaction(whitePlayerAccount, () => {
      zkApp.resign();
    });
    await txn2.prove();
    await txn2.sign([whitePlayerKey]).send();
    console.log(zkApp.getGameState().toFEN());
  });

  it('start game twice', async () => {
    await localDeploy();
    const txn = await Mina.transaction(whitePlayerAccount, () => {
      zkApp.start(whitePlayerAccount, blackPlayerAccount);
    });
    await txn.prove();
    await txn.sign([whitePlayerKey]).send();
    console.log(zkApp.getGameState().toFEN());

    const txn2 = await Mina.transaction(whitePlayerAccount, () => {
      zkApp.move(Move.fromLAN('b1', 'a3'), Field(RANK.from.name.ROOK));
    });
    await txn2.prove();
    await txn2.sign([whitePlayerKey]).send();
    console.log(zkApp.getGameState().toFEN());

    const txn3 = await Mina.transaction(whitePlayerAccount, () => {
      zkApp.start(whitePlayerAccount, blackPlayerAccount);
    });
    await txn3.prove();
    await txn3.sign([whitePlayerKey]).send();
    console.log(zkApp.getGameState().toFEN());
  });

  it('halfmove', async () => {
    await localDeploy();

    const txn = await Mina.transaction(whitePlayerAccount, () => {
      zkApp.start(whitePlayerAccount, blackPlayerAccount);
    });
    await txn.prove();
    await txn.sign([whitePlayerKey]).send();
    console.log(zkApp.getGameState().toFEN());

    const moves = [
      ['b1', 'c3'],
      ['b8', 'c6'],
      ['e2', 'e3'],
    ];
    for (let i = 0; i < moves.length; i++) {
      const player = i % 2 == 0 ? whitePlayerAccount : blackPlayerAccount;
      const key = i % 2 == 0 ? whitePlayerKey : blackPlayerKey;
      const from = moves[i][0];
      const to = moves[i][1];
      console.log(from, to);
      const txn2 = await Mina.transaction(player, () => {
        zkApp.move(Move.fromLAN(from, to), Field(RANK.from.name.ROOK));
      });
      await txn2.prove();
      await txn2.sign([key]).send();
      console.log(zkApp.getGameState().toFEN());
    }
  });

  it('enpassant', async () => {
    await localDeploy();

    const txn = await Mina.transaction(whitePlayerAccount, () => {
      zkApp.start(whitePlayerAccount, blackPlayerAccount);
    });
    await txn.prove();
    await txn.sign([whitePlayerKey]).send();
    console.log(zkApp.getGameState().toFEN());

    const moves = [
      ['e2', 'e4'],
      ['d7', 'd5'],
      ['e4', 'd5'],
      ['e7', 'e5'],
      ['d5', 'e6'],
    ];
    for (let i = 0; i < moves.length; i++) {
      const player = i % 2 == 0 ? whitePlayerAccount : blackPlayerAccount;
      const key = i % 2 == 0 ? whitePlayerKey : blackPlayerKey;
      const from = moves[i][0];
      const to = moves[i][1];
      console.log(from, to);
      const txn2 = await Mina.transaction(player, () => {
        zkApp.move(Move.fromLAN(from, to), Field(RANK.from.name.ROOK));
      });
      await txn2.prove();
      await txn2.sign([key]).send();
      console.log(zkApp.getGameState().toFEN());
    }
  });

  it('castling', async () => {
    await localDeploy();

    const txn = await Mina.transaction(whitePlayerAccount, () => {
      zkApp.start(whitePlayerAccount, blackPlayerAccount);
    });
    await txn.prove();
    await txn.sign([whitePlayerKey]).send();
    console.log(zkApp.getGameState().toFEN());

    const moves = [
      ['e2', 'e4'],
      ['c7', 'c6'],
      ['f1', 'b5'],
      ['c6', 'b5'],
      ['g1', 'e2'],
      ['b5', 'b4'],
      ['e1', 'g1'],
    ];
    for (let i = 0; i < moves.length; i++) {
      const player = i % 2 == 0 ? whitePlayerAccount : blackPlayerAccount;
      const key = i % 2 == 0 ? whitePlayerKey : blackPlayerKey;
      const from = moves[i][0];
      const to = moves[i][1];
      console.log(from, to);
      const txn2 = await Mina.transaction(player, () => {
        zkApp.move(Move.fromLAN(from, to), Field(RANK.from.name.ROOK));
      });
      await txn2.prove();
      await txn2.sign([key]).send();
      console.log(zkApp.getGameState().toFEN());
    }
  });

  it('promotion', async () => {
    await localDeploy();

    const txn = await Mina.transaction(whitePlayerAccount, () => {
      zkApp.start(whitePlayerAccount, blackPlayerAccount);
    });
    await txn.prove();
    await txn.sign([whitePlayerKey]).send();
    console.log(zkApp.getGameState().toFEN());

    const moves = [
      ['b2', 'b4'],
      ['c7', 'c6'],
      ['b4', 'b5'],
      ['c6', 'c5'],
      ['b5', 'b6'],
      ['c5', 'c4'],
      ['b6', 'a7'],
      ['c4', 'c3'],
      ['a7', 'b8'],
    ];
    for (let i = 0; i < moves.length; i++) {
      const player = i % 2 == 0 ? whitePlayerAccount : blackPlayerAccount;
      const key = i % 2 == 0 ? whitePlayerKey : blackPlayerKey;
      const from = moves[i][0];
      const to = moves[i][1];
      console.log(from, to);
      const txn2 = await Mina.transaction(player, () => {
        zkApp.move(Move.fromLAN(from, to), Field(RANK.from.name.ROOK));
      });
      await txn2.prove();
      await txn2.sign([key]).send();
      console.log(zkApp.getGameState().toFEN());
    }
  });
});
