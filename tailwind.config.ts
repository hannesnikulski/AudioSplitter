import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // primary: {
        //   bgDark: 'oklch(0.92 0 340)',
        //   bg: 'oklch(0.96 0 340)',
        //   bgLight: 'oklch(1 0 340)',
        //   text: 'oklch(0.15 0 340)',
        //   textMuted: 'oklch(0.4 0 340)',
        // }
      },
    },
  },
  plugins: [],
} satisfies Config;
