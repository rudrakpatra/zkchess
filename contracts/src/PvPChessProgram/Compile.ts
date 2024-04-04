import { PvPChessProgram } from './PvPChessProgram.js';

console.log('compiling...');
console.time('compiled');
await PvPChessProgram.compile();
console.timeEnd('compiled');

/*
node build/src/PvPChessProgram/Compile.js
*/
