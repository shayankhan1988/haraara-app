// Landen in de Golf. Alleen de landen met enabled: true zijn zichtbaar (VAE eerst).
export const COUNTRIES = [
  { code: "AE", currency: "AED", enabled: true },
  { code: "SA", currency: "SAR", enabled: false },
  { code: "QA", currency: "QAR", enabled: false },
  { code: "KW", currency: "KWD", enabled: false },
  { code: "BH", currency: "BHD", enabled: false },
  { code: "OM", currency: "OMR", enabled: false },
] as const;

export const DEFAULT_COUNTRY = "AE";

export function currencyFor(country: string) {
  return COUNTRIES.find((c) => c.code === country)?.currency ?? "AED";
}

// Moderatieregels
export const TRUST = {
  // Aantal gepubliceerde deals waarna een gebruiker zonder moderatie mag posten
  autoPublishAfter: 3,
  // Maximaal aantal deals per gebruiker per 24 uur
  maxDealsPerDay: 10,
  // Maximaal aantal reacties per gebruiker per uur
  maxCommentsPerHour: 30,
  // Aantal open meldingen waarna een deal automatisch terug naar de wachtrij gaat
  autoHideAfterReports: 3,
};

export const SESSION_DAYS = 30;
