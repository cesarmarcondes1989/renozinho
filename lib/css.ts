import type { CSSProperties } from "react";

/**
 * Parses a "prop:value;prop2:value2" inline-style string (kebab-case) into a
 * React.CSSProperties object (camelCase). Lets us port the original
 * prototype's inline style strings with minimal rewriting.
 */
export function css(str: string | undefined | null): CSSProperties {
  if (!str) return {};
  const out: Record<string, string> = {};
  for (const decl of str.split(";")) {
    const idx = decl.indexOf(":");
    if (idx === -1) continue;
    const rawProp = decl.slice(0, idx).trim();
    const rawVal = decl.slice(idx + 1).trim();
    if (!rawProp || !rawVal) continue;
    const prop = rawProp.startsWith("--")
      ? rawProp
      : rawProp.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[prop] = rawVal;
  }
  return out as CSSProperties;
}
