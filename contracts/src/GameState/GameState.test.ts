import { GameState, defaultFEN } from './GameState.js';

describe('GameState', () => {
  it('should be able to be created', () => {
    expect(GameState.fromFEN()).toBeTruthy();
  });
  it('should be able to display', () => {
    expect(GameState.fromFEN().toFEN()).toEqual(defaultFEN);
  });
  it('should be able to encode and decode', () => {
    const fen =
      'r1bqkbnr/pp1ppppp/2n5/2p5/8/1P2P3/PBPP1PPP/RN1QKBNR b KQkq - 2 1';
    const encoded = GameState.fromFEN(fen).encode();
    expect(GameState.fromEncoded(encoded).toFEN()).toEqual(fen);
  });
});
