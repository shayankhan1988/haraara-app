// Temperatuur: elke hot-stem +1°, elke cold-stem -1°.
// Drempels zijn bewust laag gezet voor een kleine startende community; verhoog ze als het volume groeit.
export const TEMPERATURE_LEVELS = { warm: 5, hot: 15, burning: 50 } as const;

export type TemperatureLevel = "cold" | "neutral" | "warm" | "hot" | "burning";

export function temperatureFromCounts(hot: number, cold: number) {
  return hot - cold;
}

export function temperatureLevel(t: number): TemperatureLevel {
  if (t < 0) return "cold";
  if (t >= TEMPERATURE_LEVELS.burning) return "burning";
  if (t >= TEMPERATURE_LEVELS.hot) return "hot";
  if (t >= TEMPERATURE_LEVELS.warm) return "warm";
  return "neutral";
}

// Score voor de "Hot"-feed: temperatuur met tijdsverval (ongeveer zoals Hacker News).
export function hotScore(temperature: number, publishedAt: Date, now = new Date()) {
  const hours = Math.max(0, (now.getTime() - publishedAt.getTime()) / 36e5);
  return (temperature + 1) / Math.pow(hours + 2, 1.5);
}
