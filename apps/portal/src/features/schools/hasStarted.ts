/** An occurrence is over for booking once it has started; `now` comes from the server, so both renders agree. */
export function hasStarted(startsAt: string, now: number): boolean {
  return Date.parse(startsAt) <= now;
}
