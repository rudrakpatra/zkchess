import { Pickles } from "o1js/dist/node/snarky.js";
import { dummyBase64Proof } from "o1js/dist/node/lib/proof-system.js";
import fs from "fs";
import { PvPChessProgramProof, RollupState } from "./PvPChessProgram";
import { GameState } from "./GameState/GameState";
import { PrivateKey } from "o1js";

describe("generate dummy", () => {
    it("should be a dummy", async () => {
        const white = PrivateKey.random();
        const black = PrivateKey.random();
        
        const [, dummy] = Pickles.proofOfBase64(await dummyBase64Proof(), 2);
        const j = JSON.stringify(dummy, (key, value) => typeof value === "bigint" ? value.toString() + "n" : value);
        fs.writeFileSync("dummy.json", j);
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
    });
});
