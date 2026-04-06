/**
 * Fallback sin cliente actualizado: dos `YYYY-MM-DD` como **día calendario UTC** (00:00–23:59:59.999Z).
 * Si la app envía `timestampStart`/`timestampEnd` (día local → ISO), el servicio usa esos y no esta función.
 */
export function utcInclusiveDayBounds(
  fromIso: string,
  toIso: string,
): { start: Date; end: Date } {
  const start = new Date(`${fromIso}T00:00:00.000Z`);
  const end = new Date(`${toIso}T23:59:59.999Z`);
  return { start, end };
}
