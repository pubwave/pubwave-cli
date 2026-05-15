function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object"
    && value !== null
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

export function deepMergePartial<T>(current: T, partial: unknown): T {
  if (!isPlainObject(current) || !isPlainObject(partial)) {
    return (partial === undefined ? current : partial) as T;
  }

  const result: Record<string, unknown> = { ...current };
  for (const key of Object.keys(partial)) {
    const incoming = partial[key];
    const existing = result[key];
    if (incoming === undefined) continue;
    if (Array.isArray(incoming)) {
      result[key] = incoming;
      continue;
    }
    if (isPlainObject(incoming) && isPlainObject(existing)) {
      result[key] = deepMergePartial(existing, incoming);
      continue;
    }
    result[key] = incoming;
  }
  return result as T;
}
