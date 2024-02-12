import { PvPChessProgram } from './PvPChessProgram.js';

console.time('compile');
await PvPChessProgram.compile();
console.timeEnd('compile');
