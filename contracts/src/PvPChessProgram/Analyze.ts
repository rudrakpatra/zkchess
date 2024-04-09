import { PvPChessProgram } from './PvPChessProgram.js';

console.time('methods analyzed');
const methods = [
  {
    name: 'PvPChessProgram',
    result: PvPChessProgram.analyzeMethods(),
    skip: true,
  },
];
console.timeEnd('methods analyzed');
const maxRows = 2 ** 16;
for (const contract of methods) {
  // calculate the size of the contract - the sum or rows for each method
  const size = Object.values(contract.result).reduce(
    (acc, method) => acc + method.rows,
    0
  );
  // calculate percentage rounded to 0 decimal places
  const percentage = Math.round((size / maxRows) * 100);

  console.log(
    `method's total size for a ${contract.name} is ${size} rows (${percentage}% of max ${maxRows} rows)`
  );
  if (contract.skip !== true)
    for (const method in contract.result) {
      console.log(method, `rows:`, (contract.result as any)[method].rows);
    }
}

/*
node build/src/PvPChessProgram/Analyze.js
*/
