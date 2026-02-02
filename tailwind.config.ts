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
        // Wimbledon brand colors
        wimbledon: {
          purple: {
            DEFAULT: '#6B46C1',
            light: '#8B5CF6',
            dark: '#5B21B6',
          },
          green: {
            DEFAULT: '#00A86B',
            light: '#10B981',
            dark: '#047857',
          },
        },
        // Enhanced status colors
        status: {
          open: '#10B981',
          closing: '#F59E0B',
          locked: '#EF4444',
          active: '#3B82F6',
        }
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};
export default config;
