export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function exponentialBackoff(
  attempt: number,
  { initial = 1, max = 60, maxRetries = 6 } = {},
) {
  if (attempt >= maxRetries) {
    throw new Error(`Max retries exceeded (${maxRetries})`);
  }
  const delay = Math.min(max, initial * 2 ** attempt) * 1000;
  return new Promise((resolve) => setTimeout(resolve, delay));
}
