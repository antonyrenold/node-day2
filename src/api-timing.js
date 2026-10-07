const urls = Array.from(
  { length: 10 },
  (_, index) => `https://jsonplaceholder.typicode.com/posts/${index + 1}`,
);

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function main() {
  const parallelStart = performance.now();
  const parallelResults = await Promise.all(urls.map(fetchJson));
  const parallelDuration = performance.now() - parallelStart;

  const sequentialStart = performance.now();
  const sequentialResults = [];

  for (const url of urls) {
    sequentialResults.push(await fetchJson(url));
  }

  const sequentialDuration = performance.now() - sequentialStart;

  console.log(`Fetched ${parallelResults.length} URLs in parallel: ${parallelDuration.toFixed(2)} ms`);
  console.log(`Fetched ${sequentialResults.length} URLs sequentially: ${sequentialDuration.toFixed(2)} ms`);
}

main().catch((error) => {
  console.error('API timing run failed:', error);
  process.exitCode = 1;
});
