export function daysAgo(days: number) {
  return new Date(Date.now() - days * 864e5);
}
