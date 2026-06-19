import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        garnet: {
          50: "#FBEEEF",
          100: "#F4D2D6",
          200: "#E6A3AC",
          300: "#D6717E",
          400: "#C24A58",
          500: "#B3122B",
          600: "#960F25",
          700: "#7A0E1F",
          800: "#5E0B18",
          900: "#430810",
        },
        sand: {
          50: "#FDFBFA",
          100: "#F7F1EE",
          200: "#EFE4DE",
          300: "#ECE1DD",
        },
        ink: {
          900: "#221318",
          700: "#3D2A30",
          500: "#6B5860",
          300: "#9C8A91",
        },
        amber: {
          400: "#E4B73B",
          500: "#D9A441",
        },
        lab: {
          teal: "#2F9E6E",
          navy: "#2451B3",
          amber: "#D9A441",
          garnet: "#B3122B",
          gold: "#E4B73B",
        },
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(34, 19, 24, 0.04), 0 8px 24px -8px rgba(34, 19, 24, 0.08)",
        pop: "0 12px 32px -12px rgba(179, 18, 43, 0.35)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      backgroundImage: {
        "garnet-gradient": "linear-gradient(120deg, #960F25 0%, #B3122B 45%, #7A0E1F 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
