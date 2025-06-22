import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#fdf6ec", // Parchment-like
        foreground: "#4b1e1e", // Deep earthy red

        primary: {
          DEFAULT: "#a6192e", // Fortune red
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#fff4e6", // Light scroll background
          foreground: "#a6192e",
        },
        accent: {
          DEFAULT: "#e6b422", // Imperial gold
          foreground: "#4b1e1e",
        },
        destructive: {
          DEFAULT: "#8b1e1e",
          foreground: "#fff",
        },
        muted: {
          DEFAULT: "#fce8cc",
          foreground: "#a6192e",
        },
        border: "#a6192e",
        input: "#fcefe6",
        ring: "#e6b422",

        card: {
          DEFAULT: "#fffdf9",
          foreground: "#4b1e1e",
        },
        popover: {
          DEFAULT: "#fffaf0",
          foreground: "#4b1e1e",
        },

        chart: {
          "1": "#e6b422",
          "2": "#a6192e",
          "3": "#8b1e1e",
          "4": "#d49a6a",
          "5": "#f0cba8",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "serif"], // Chinese serif vibe
      },
      borderRadius: {
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'bounce-slight': 'bounce-slight 0.6s ease-out',
        'pulse-subtle': 'pulse-subtle 4s ease-in-out infinite',
      },
      keyframes: {
        'bounce-slight': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8%)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.92 },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
