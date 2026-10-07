import { readFile } from 'node:fs';

const expectedOrder = ['nextTick', 'Promise.then', 'setImmediate', 'setTimeout'];
const actualOrder = [];

readFile(new URL(import.meta.url), (error) => {
  if (error) {
    console.error('Unable to start the event-loop example:', error);
    process.exitCode = 1;
    return;
  }

  setTimeout(() => {
    actualOrder.push('setTimeout');
    printResults();
  }, 0);

  setImmediate(() => {
    actualOrder.push('setImmediate');
  });

  Promise.resolve().then(() => {
    actualOrder.push('Promise.then');
  });

  process.nextTick(() => {
    actualOrder.push('nextTick');
  });

  function printResults() {
    console.log(`Predicted: ${expectedOrder.join(' -> ')}`);
    console.log(`Observed:  ${actualOrder.join(' -> ')}`);

    if (actualOrder.join('|') !== expectedOrder.join('|')) {
      console.error('Observed order differed from the prediction.');
      process.exitCode = 1;
    }
  }
});
