import { Pickles } from "o1js/dist/node/snarky.js";
import { dummyBase64Proof } from "o1js/dist/node/lib/proof-system.js";

import { PrivateKey } from "o1js";
import { PvPChessProgramProof, RollupState } from "./PvPChessProgram.js";
import { GameState } from "./GameState/GameState.js";


const [, dummy] = Pickles.proofOfBase64(await dummyBase64Proof(), 2);

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