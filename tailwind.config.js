/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],

  presets: [require("nativewind/preset")],

  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0B0F19",
          card: "#151C2C",
          input: "#1E293B",
          accent: "#6366F1",
          purple: "#8B5CF6",
          success: "#10B981",
          danger: "#EF4444",
          text: "#F8FAFC",
          muted: "#94A3B8",
          border: "#1E293B",
        },
      },
    },
  },

  plugins: [],
};
