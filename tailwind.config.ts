import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // IBM Carbon inspired color palette
        background: "#ffffff",
        surface: "#f4f4f4",
        border: "#e0e0e0",
        text: {
          primary: "#161616",
          secondary: "#525252",
          disabled: "#8d8d8d",
        },
        ui: {
          background: "#ffffff",
          "01": "#f4f4f4",
          "02": "#ffffff",
          "03": "#e0e0e0",
          "04": "#8d8d8d",
          "05": "#161616",
        },
        interactive: {
          primary: "#0f62fe",
          secondary: "#393939",
          tertiary: "#0f62fe",
          danger: "#da1e28",
        },
        status: {
          available: "#bbf7d0", // green-200 pastel
          pending: "#fde68a", // yellow-200 pastel
          occupied: "#fecaca", // red-200 pastel
          selected: "#dbeafe", // blue-200 pastel
        },
      },
      fontFamily: {
        sans: [
          "'IBM Plex Sans'",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "'Helvetica Neue'",
          "Arial",
          "sans-serif",
        ],
        mono: ["'IBM Plex Mono'", "Menlo", "Monaco", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

// Made with Bob
