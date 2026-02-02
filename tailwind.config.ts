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
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Authentic Wimbledon brand colors
        wimbledon: {
          purple: {
            DEFAULT: '#2E1A47', // Deep purple from logo
            light: '#4A2E6B',
            dark: '#1A0F2E',
          },
          green: {
            DEFAULT: '#006633', // Classic Wimbledon green
            light: '#007A3D',
            dark: '#004D26',
          },
          cream: '#F5F5F0', // Off-white background
        },
        // Refined status colors
        status: {
          open: '#007A3D', // Wimbledon green
          closing: '#D97706', // Amber
          locked: '#DC2626', // Red
          active: '#2563EB', // Blue
        }
      },
      boxShadow: {
        'card': '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // Subtle Wimbledon-style shadow
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'elegant': '0 2px 8px 0 rgba(46, 26, 71, 0.08)', // Purple-tinted shadow
      },
    },
  },
  plugins: [],
};
export default config;
