import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/config/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#071B3B",
          teal: "#0E9F9A",
        },
        surface: {
          bg: "#F8FAFC",
          border: "#E2E8F0",
        },
        content: {
          main: "#0F172A",
          muted: "#475569",
          light: "#94A3B8",
        },
      },

      fontSize: {
        metric: ["32px", { lineHeight: "40px", fontWeight: "700" }], // 32px / Bold
        "page-heading": ["24px", { lineHeight: "32px", fontWeight: "600" }], // 24px / Semibold
        "section-heading": ["18px", { lineHeight: "28px", fontWeight: "600" }], // 18px / Semibold
        body: ["14px", { lineHeight: "20px", fontWeight: "400" }], // 14px / Regular
        small: ["12px", { lineHeight: "16px", fontWeight: "500" }], // 12px / Medium
      },

      // 3. Custom Soft Shadow for your Cards
      boxShadow: {
        soft: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};
export default config;
