import { Bool, Field, Provable } from 'o1js';
import { Position } from './Position.js';

describe('Position', () => {
  it('should be able to be created', () => {
    expect(Position.from(1, 2)).toBeTruthy();
  });
  it('should be able to be created from encoded', () => {
    expect(
      Position.fromEncoded([
        Field.fromBits(
          [true, true, false, false, true, false].map((x) => Bool(x))
        ),
      ])
    ).toEqual(Position.from(3, 2));
  });
  
  it('should be able to be encoded', () => {
    expect(Position.from(1, 3).encode()).toEqual([
      Field.fromBits(
        [true, false, false, true, true, false].map((x) => Bool(x))
      ),
    ]);
  });

  it('equals', () => {
    expect(Position.from(1, 3).equals(Position.from(1, 3))).toEqual(Bool(true));
  });

  it('toFields', () => {
    expect(Position.from(1, 3).toFields()).toEqual(Position.toFields({row:Field.from(1),column:Field.from(3)}));
  });
  it('Provable.if',()=>{
    expect(Provable.if(Bool(true), Position.from(1,2) , Position.from(2,3))).toStrictEqual(Position.from(1,2));
  })
});
