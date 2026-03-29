import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Soft Lavender palette — https://coolors.co/palette/22223b-4a4e69-9a8c98-c9ada7-f2e9e4
        "lavender-dark":  "#22223b",  // dark navy/purple — primary text, hero bg
        "lavender-mid":   "#4a4e69",  // muted purple — headings, active states
        "lavender-muted": "#9a8c98",  // mauve — secondary text, borders
        "lavender-rose":  "#c9ada7",  // dusty rose — accents, highlights
        "lavender-cream": "#f2e9e4",  // cream — page background, card bg
      },
    },
  },
  plugins: [],
};

export default config;
