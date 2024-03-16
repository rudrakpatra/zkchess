import { PrivateKey } from "o1js";
import { PvPChessProgramProof, RollupState } from "./PvPChessProgram";
import { GameState } from "./GameState/GameState";
import { Pickles } from "o1js/dist/node/snarky";
import { dummyBase64Proof } from "o1js/dist/node/lib/proof-system";


const [, dummy] = Pickles.proofOfBase64(await dummyBase64Proof(), 2);

//run dummy proof
describe('dummy proof', () => {
    it("start",async()=>{
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
        expect(proof.publicInput.white).toEqual(white.toPublicKey());
        expect(proof.publicInput.black).toEqual(black.toPublicKey());
      
        expect(proof.publicOutput.encode()).toEqual(initialGameState.encode());
    })
});
