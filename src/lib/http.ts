/**
 * Reads a response body as JSON without assuming the body is JSON. Next.js
 * error responses are HTML, and `response.json()` on those throws a parse
 * error that hides the real status from the customer.
 */
export async function readResponseJson<T>(response: Response): Promise<T | null> {
  let text: string;

  try {
    text = await response.text();
  } catch {
    return null;
  }

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function describeResponseFailure(response: Response): string {
  if (response.status === 500 || response.status === 502 || response.status === 503) {
    return `The checkout could not be completed (server error ${response.status}). Please try again in a moment.`;
  }

  return `The checkout could not be completed (HTTP ${response.status}). Please try again.`;
}
