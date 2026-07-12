export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function defaultTripDates(): { start: string; end: string } {
  return { start: addDaysISO(30), end: addDaysISO(33) };
}
