/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50:'#fff7ed',100:'#ffedd5',200:'#fed7aa',300:'#fdba74',400:'#fb923c',500:'#f97316',600:'#ea580c',700:'#c2410c',800:'#9a3412',900:'#7c2d12' },
        dark: { 950:'#0a0a0f',900:'#111118',800:'#1a1a24',700:'#242432',600:'#2e2e3f',500:'#3a3a50' }
      },
      fontFamily: {
        display: ['Bebas Neue','Impact','sans-serif'],
        body: ['DM Sans','sans-serif'],
        mono: ['JetBrains Mono','monospace']
      }
    }
  },
  plugins: []
}
