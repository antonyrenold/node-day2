import { readFile as readFileCallbackApi } from 'node:fs';
import { readFile as readFilePromiseApi } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export function readFileCallback(filePath, callback) {
  readFileCallbackApi(filePath, 'utf8', callback);
}

export function readFilePromise(filePath) {
  return readFilePromiseApi(filePath, 'utf8');
}

export async function readFileAsync(filePath) {
  const contents = await readFilePromiseApi(filePath, 'utf8');
  return contents;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const filePath = process.argv[2];

  if (!filePath) {
    throw new Error('Please provide a file path: node src/promises.js <file-path>');
  }

  console.log('Callback style:');
  readFileCallback(filePath, (error, contents) => {
    if (error) {
      console.error(`Unable to read "${filePath}" with callback:`, error);
      process.exitCode = 1;
    } else {
      console.log(contents);
    }

    console.log('Promise style (.then/.catch):');
    readFilePromise(filePath)
      .then((contents) => {
        console.log(contents);
      })
      .catch((error) => {
        console.error(`Unable to read "${filePath}" with Promise:`, error);
        process.exitCode = 1;
      })
      .then(() => {
        console.log('Async/await style:');
        return readFileAsync(filePath);
      })
      .then((contents) => {
        console.log(contents);
      })
      .catch((error) => {
        console.error(`Unable to read "${filePath}" with async/await:`, error);
        process.exitCode = 1;
      });
  });
}
