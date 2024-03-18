import { Pickles } from "o1js/dist/node/snarky.js";
import { dummyBase64Proof } from "o1js/dist/node/lib/proof-system.js";
import { PvPChessProgramProof, RollupState } from "../PvPChessProgram/PvPChessProgram";
import { GameState } from "../GameState/GameState";
import { PrivateKey } from "o1js";
import { chdir, cwd } from 'node:process';
import fs from "fs";


function stringify(value:any) {
    if (value !== undefined) {
        return JSON.stringify(value, (_, v) => typeof v === 'bigint' ? `${v}#bigint` : v);
    }
}
function parse(text:string) {
    return JSON.parse(text, (_, value) => {
        if (typeof value === 'string') {
            const m = value.match(/^(-?\d+)#bigint$/);
            if (m && m[0] === value) {
                value = BigInt(m[1]);
            }
        }
        return value;
    });
}

const handleJSON = (key:string, value:any) => {                                          
    if (typeof value === 'string' && /^\d+n$/.test(value)) {
        return BigInt(value.substring(0, value.length - 1));
    }
    return value;
}


function testDummyProof(dummy:any) {
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
}

describe("dummy proof", () => {

    it("test the dummy from Pickles with PvPChessProgram", async()=>{
        const [, dummy0] = Pickles.proofOfBase64(await dummyBase64Proof(), 2);
        console.log(dummy0);
        // testDummyProof(dummy0);
    });

    // it("generate a dummy", async () => {
    //     console.log(`Starting directory: ${cwd()}`);
    //     const [, dummy] = Pickles.proofOfBase64(await dummyBase64Proof(), 2);
    //     const j = JSON.stringify(dummy, (key, value) => typeof value === "bigint" ? value.toString() + "n" : value);
    //     //change the path to the file you want to save the dummy proof
    //     fs.writeFileSync("src/DummyProof/dummy.json", j);
    // });

    it("test the dummy with Serialization with PvPChessProgram", async()=>{
        const [, dummy0] = Pickles.proofOfBase64(await dummyBase64Proof(), 2);

        //change the path to the file you want to save the dummy proof
        // fs.writeFileSync("src/DummyProof/dummy.json", j!);
        // const dummyJSON=fs.readFileSync("src/DummyProof/dummy.json", "utf-8");
        const dummyJSON=stringify(dummy0);
        fs.writeFileSync("src/DummyProof/dummy.json", dummyJSON!);
        
        // replace all Object with MlInt64
        const dummy = parse(dummyJSON!);
        expect(dummy).toStrictEqual(dummy0);
        // testDummyProof(dummy);
    });
});

/*

npm run test -- dummy.test.ts

*/