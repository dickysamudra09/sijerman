/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // semua file di src/
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border)", // supaya border-border valid
        background: "var(--background)",
        foreground: "var(--foreground)",
        // tambahkan lainnya sesuai kebutuhan
      },
    },
  },
  plugins: [],
};
