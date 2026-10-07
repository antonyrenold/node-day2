import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const MAX_BODY_BYTES = 1024 * 1024; // (approx 1mb)

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

export function createHttpServer() {
  return createServer((request, response) => {
    const { method } = request;
    const pathname = new URL(request.url, 'http://localhost').pathname;

    if (method === 'GET' && pathname === '/health') {
      sendJson(response, 200, { status: 'ok' });
      return;
    }

    if (method === 'POST' && pathname === '/echo') {
      const chunks = [];
      let bodyBytes = 0;
      let tooLarge = false;

      request.on('data', (chunk) => {
        bodyBytes += chunk.length;

        if (bodyBytes > MAX_BODY_BYTES) {
          tooLarge = true;
          chunks.length = 0;
          return;
        }

        if (!tooLarge) {
          chunks.push(chunk);
        }
      });

      request.on('end', () => {
        if (tooLarge) {
          sendJson(response, 413, { error: 'Request body exceeds 1 MB.' });
          return;
        }

        try {
          const body = Buffer.concat(chunks).toString('utf8');
          const parsedBody = JSON.parse(body);
          sendJson(response, 200, parsedBody);
        } catch {
          sendJson(response, 400, { error: 'Request body must contain valid JSON.' });
        }
      });

      request.on('error', (error) => {
        if (!response.headersSent) {
          sendJson(response, 400, { error: 'Unable to read request body.' });
        }
        console.error('Request body read failed:', error);
      });

      return;
    }

    if (pathname === '/health' || pathname === '/echo') {
      sendJson(response, 405, { error: 'Method not allowed.' });
      return;
    }

    sendJson(response, 404, { error: 'Not found.' });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT ?? 3000);
  const server = createHttpServer();

  server.listen(port, () => {
    console.log(`HTTP server listening at http://localhost:${port}`);
  });

  server.on('error', (error) => {
    console.error('HTTP server failed:', error);
    process.exitCode = 1;
  });
}
