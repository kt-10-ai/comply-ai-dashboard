/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:        "#F8FAFC",
        surface:   "#FFFFFF",
        card:      "#FFFFFF",
        border:    "#E2E8F0",
        navy:      "#0F2744",
        navylight: "#1A3A6B",
        navymid:   "#162B52",
        accent:    "#2563EB",
        accenthov: "#1D4ED8",
        amber:     "#D97706",
        amberlt:   "#FEF3C7",
        danger:    "#DC2626",
        dangerlt:  "#FEE2E2",
        success:   "#059669",
        successlt: "#D1FAE5",
        muted:     "#94A3B8",
        text:      "#0F172A",
        subtext:   "#64748B",
        slate100:  "#F1F5F9",
        slate200:  "#E2E8F0",
      },
      fontFamily: {
        display: ["'DM Serif Display'", "serif"],
        body:    ["'Inter'", "sans-serif"],
        mono:    ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(15,39,68,0.06), 0 1px 2px rgba(15,39,68,0.04)",
        elevated: "0 4px 16px rgba(15,39,68,0.10)",
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      }
    },
  },
  plugins: [],
}
