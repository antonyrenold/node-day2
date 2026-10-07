import { createReadStream, createWriteStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { StringDecoder } from 'node:string_decoder';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

function createUppercaseTransform() {
  const decoder = new StringDecoder('utf8');

  return new Transform({
    transform(chunk, _encoding, callback) {
      callback(null, decoder.write(chunk).toUpperCase());
    },
    flush(callback) {
      callback(null, decoder.end().toUpperCase());
    },
  });
}

function createLineCountingTransform() {
  let lineCount = 0;
  let sawData = false;
  let lastByte = null;

  const transform = new Transform({
    transform(chunk, _encoding, callback) {
      sawData = sawData || chunk.length > 0;
      if (chunk.length > 0) {
        lastByte = chunk[chunk.length - 1];
      }

      for (const byte of chunk) {
        if (byte === 0x0a) {
          lineCount += 1;
        }
      }

      callback(null, chunk);
    },
    flush(callback) {
      if (sawData && lastByte !== 0x0a) {
        lineCount += 1;
      }

      callback();
    },
  });

  transform.getLineCount = () => lineCount;
  return transform;
}

export async function processFile(inputPath, outputPath, mode = 'copy') {
  const source = resolve(inputPath);
  const destination = resolve(outputPath);

  if (source === destination) {
    throw new Error('Input and output paths must be different.');
  }

  if (!['copy', 'uppercase', 'count-lines'].includes(mode)) {
    throw new Error(`Unsupported mode "${mode}". Use copy, uppercase, or count-lines.`);
  }

  const inputStats = await stat(source);
  const lineTransform = mode === 'count-lines' ? createLineCountingTransform() : null;
  const transform = mode === 'uppercase'
    ? createUppercaseTransform()
    : lineTransform;
  const streams = [createReadStream(source)];

  if (transform) {
    streams.push(transform);
  }

  streams.push(createWriteStream(destination));
  await pipeline(...streams);

  return {
    bytes: inputStats.size,
    lines: lineTransform?.getLineCount(),
  };
}

async function main() {
  const [, , inputPath, outputPath, mode = 'copy'] = process.argv;

  if (!inputPath || !outputPath) {
    throw new Error(
      'Usage: node src/stream-processor.js <input-file> <output-file> [copy|uppercase|count-lines]',
    );
  }

  const result = await processFile(inputPath, outputPath, mode);
  console.log(`Processed ${result.bytes} bytes from "${basename(inputPath)}" using ${mode} mode.`);

  if (result.lines !== undefined) {
    console.log(`Line count: ${result.lines}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error('File processing failed:', error);
    process.exitCode = 1;
  });
}
