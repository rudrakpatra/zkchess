import { PrivateKey } from "o1js";
import { PvPChessProgramProof, RollupState } from "../PvPChessProgram/PvPChessProgram.js";
import { GameState } from "../GameState/GameState.js";
import fs from "fs";

const dummyStr = fs.readFileSync("src/DummyProof/dummy.json", "utf-8");
console.log(dummyStr.slice(0, 100)+"...\n\n\n");
const dummy = JSON.parse(dummyStr, (key, value) => {
    if (typeof value === 'string' && /^\d+n$/.test(value)) {
        return BigInt(value.substring(0, value.length - 1));
    }
    return value;
});
//run dummy proof
    const white = PrivateKey.random();
    const black = PrivateKey.random();

    const initialGameState = GameState.fromFEN();

    const proof= new PvPChessProgramProof({
        proof: dummy,
        publicInput:  RollupState.from(
            GameState.fromFEN(),
            white.toPublicKey(),
            black.toPublicKey()
        ),
        publicOutput: GameState.fromFEN(),
        maxProofsVerified: 2
    });
    
console.log(proof.toJSON());
console.log("---------------------------");
console.log(proof.publicInput.white,white.toPublicKey());
console.log("---------------------------");
console.log(proof.publicInput.black,black.toPublicKey());
console.log("---------------------------");
console.log(proof.publicOutput.encode(),initialGameState.encode());

/*

npm run build && node build/src/DummyProof/dummy.js

*/