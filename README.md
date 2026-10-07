# Node.js Day 2 Assessment

Small, dependency-free examples covering Promises, async/await, parallel work,
streams, raw HTTP, and the Node.js event loop. Requires Node.js 20.6 or newer
(`fetch` and the server's `--env-file` option are used).

## 1. Callback reader, Promise, and async/await

`src/promises.js` reads and prints the same file three times to demonstrate:
callback-based reading, a Promise `.then().catch()` chain, and async/await.
The callback reader uses `node:fs`; the Promise and async/await readers use
Node's native `node:fs/promises` API independently.

```powershell
npm run promises -- .\README.md
node src/promises.js .\README.md
```

The reader functions are exported for reuse. The command-line example requires
a file path; missing paths throw an error, and read failures are reported for
each style.

## 2. Parallel versus sequential API requests

```powershell
npm run api-timing
```

The script fetches ten JSONPlaceholder posts with `Promise.all`, then fetches
the same URLs one at a time and reports both elapsed times. Network latency and
the remote service affect results, so repeated timings may differ.

## 3. Streaming file processor

`src/stream-processor.js` uses `stream/promises.pipeline` to process files
without loading the whole file into memory. It supports plain copying,
UTF-8 uppercasing, and line counting while passing the original bytes through.
It can process files larger than 500 MB; provide an existing large input file
instead of creating a large fixture in the project.

```powershell
node src/stream-processor.js <input-file> <output-file> [copy|uppercase|count-lines]
```

Examples:

```powershell
node src/stream-processor.js .\large-input.bin .\large-copy.bin copy
node src/stream-processor.js .\large-input.txt .\uppercase.txt uppercase
node src/stream-processor.js .\large-input.txt .\line-count-copy.txt count-lines
```

`count-lines` counts LF-delimited lines and includes a final unterminated line.
The input and output paths must differ.

## 4. Bare HTTP server

```powershell
npm run server
```

The server reads `HOST` and `PORT` from the project `.env` file and listens on
`127.0.0.1:3000` by default. Change those values in `.env` to configure it.
Environment variables already set in the shell take precedence.

```powershell
Invoke-RestMethod http://127.0.0.1:3000/health
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:3000/echo `
  -ContentType 'application/json' -Body '{"message":"hello"}'
```

`GET /health` returns `{"status":"ok"}`. `POST /echo` parses and returns the
submitted JSON. Invalid JSON returns 400, request bodies above 1 MB return
413, unsupported methods on these paths return 405, and unknown paths return
404.

## 5. Event-loop ordering

```powershell
npm run event-loop
```

The script prints its predicted order and the observed order for
`process.nextTick`, `Promise.then`, `setImmediate`, and `setTimeout`. The timers
are scheduled inside an I/O callback so the expected ordering is
`nextTick -> Promise.then -> setImmediate -> setTimeout`.
