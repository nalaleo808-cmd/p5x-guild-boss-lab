// Shared Lufelnet fetch and parse helpers for the sync scripts.
export async function get(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'P5X-Guild-Boss-Simulator data sync' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

// Parses the object literal assigned after `marker` in a Lufel data script.
// With { optional: true } a missing marker returns null instead of throwing.
export function assignedObject(source, marker, { optional = false } = {}) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) {
    if (optional) return null;
    throw new Error(`Assignment not found: ${marker}`);
  }
  const start = source.indexOf('{', markerIndex + marker.length);
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (char === '{') depth += 1;
    if (char === '}' && --depth === 0) {
      const literal = source.slice(start, index + 1).replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(literal);
    }
  }
  throw new Error(`Unterminated object: ${marker}`);
}
