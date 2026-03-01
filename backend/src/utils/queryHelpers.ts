/**
 * Express req.query values are `string | string[] | ParsedQs | ParsedQs[]`.
 * This utility extracts a clean string value, using a fallback if undefined.
 */
export function qs(value: any, fallback?: string): string {
    if (Array.isArray(value)) return value[0] ?? fallback ?? '';
    if (typeof value === 'string') return value;
    return fallback ?? '';
}

/**
 * Converts a query param to a number with optional fallback.
 */
export function qn(value: any, fallback: number): number {
    const s = qs(value);
    if (!s || s.trim() === '') return fallback;
    const n = Number(s);
    return isNaN(n) ? fallback : n;
}

/**
 * Express 5.x changed req.params values to `string | string[]`.
 * This safely extracts a string route param.
 */
export function rp(value: string | string[] | undefined): string {
    if (Array.isArray(value)) return value[0] ?? '';
    return value ?? '';
}
