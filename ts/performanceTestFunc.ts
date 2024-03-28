import { performance } from 'perf_hooks';

// url: https://medium.com/@priteymehta9/perf-hooks-in-nodejs-303fd1c8bfb7

export const performanceTestFunc = (func: Function) => {
  console.log('');
  const tStart = performance.now();
  const output = func();
  const tEnd = performance.now();
  console.log(`${func.toString()} - execution time: ${tEnd - tStart} ms (length: ${output.length})`);

  console.log(`------------------`);
  console.log(`Total chars: ${countCharacters(output)}`);
  console.log(`1: ${output[1]}`);
  console.log(`------------------`);
};

const countCharacters = (array: string[]): number => {
  let characterCount = 0;
  for (const sentence of array) {
    characterCount += sentence.length;
  }
  return characterCount;
};
