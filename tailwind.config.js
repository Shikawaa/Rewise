/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        purple: {
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
        },
        rewise: {
          blue: '#0A2342',
          mint: '#3BCEAC',
          lightmint: '#6EE7D1',
          darkmint: '#2BA68C',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 