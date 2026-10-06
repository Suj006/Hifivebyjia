/** India Standard Time helpers for date inputs (IST = UTC+05:30, no daylight saving). */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** "2026-10-06T10:00" (entered in IST) → ISO string. Empty → undefined. */
export function istInputToIso(value: string): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return undefined;
  const d = new Date(`${value}:00+05:30`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** ISO string → "2026-10-06T10:00" in IST for <input type="datetime-local">. */
export function isoToIstInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 16);
}
