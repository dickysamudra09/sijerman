/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}", // Untuk App Router
    // "./pages/**/*.{js,ts,jsx,tsx}", // Untuk Pages Router (opsional jika tidak digunakan)
    // "./components/**/*.{js,ts,jsx,tsx}", // Komponen di root atau src/components
    "./src/**/*.{js,ts,jsx,tsx}", // Semua file di src/ (jika digunakan)
    "./node_modules/@radix-ui/**/*.js", // Sertakan Radix UI untuk mendeteksi kelas
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Tambahkan warna lain jika perlu, misalnya:
        // primary: "var(--primary)",
        // secondary: "var(--secondary)",
        // accent: "var(--accent)",
        // muted: "var(--muted)",
      },
    },
  },
  plugins: [],
};