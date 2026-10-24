/**
 * The day number of the campaign (story 5.4, architecture §5.6, ADR-2): the only wall clock the campaign sees. A day
 * starts at `resetHour` local time (balance.yaml `day.resetHour`, 04:00). Only the local date and hour count, so a change
 * to or from summer time moves nothing (subtracting the hours from the timestamp would shift the change by one hour on
 * those two nights).
 */
export function dayNumber(now = Date.now(), resetHour = 4): number {
  const d = new Date(now);
  const date = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
  return d.getHours() < resetHour ? date - 1 : date; // before 04:00 counts to the day before
}
