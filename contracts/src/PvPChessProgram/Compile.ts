import { PvPChessProgram } from './PvPChessProgram.js';
console.log('analyze...');
console.time('analyzed');
console.log(await PvPChessProgram.analyzeMethods());
console.timeEnd('analyzed');

console.log('compiling...');
console.time('compiled');
await PvPChessProgram.compile();
console.timeEnd('compiled');

/*
node build/src/PvPChessProgram/Compile.js
*/
