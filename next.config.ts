import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bewust uit: bijna elke pagina hangt af van de ingelogde gebruiker (cookies), dus alles rendert per verzoek.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
