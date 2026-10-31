/** Parse JSON without silently choosing between repeated property names. */
export function parseJson(text: string): unknown {
  const value: unknown = JSON.parse(text);
  const objects: (Set<string> | null)[] = [];
  // Syntax was checked above. Outside quoted strings, a colon can only
  // follow an object key; decode escapes before comparing its identity.
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "{") objects.push(new Set());
    else if (char === "[") objects.push(null);
    else if (char === "}" || char === "]") objects.pop();
    else if (char === '"') {
      const start = i;
      for (i++; text[i] !== '"'; i++) if (text[i] === "\\") i++;
      let next = i + 1;
      while (/[\t\r\n ]/.test(text[next] ?? "")) next++;
      if (text[next] !== ":") continue;
      const keys = objects.at(-1);
      if (!keys) continue;
      const key = JSON.parse(text.slice(start, i + 1)) as string;
      if (keys.has(key))
        throw new Error(`Repeated JSON field ${JSON.stringify(key)}. Keep one explicit value.`);
      keys.add(key);
    }
  }
  return value;
}
