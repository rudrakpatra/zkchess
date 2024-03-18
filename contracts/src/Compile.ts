import { PvPChessProgram } from './PvPChessProgram/PvPChessProgram.js';

console.time('compile');
await PvPChessProgram.compile();
console.timeEnd('compile');
