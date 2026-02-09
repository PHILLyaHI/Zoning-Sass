/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        "apple-blue": "#0071e3",
        "apple-blue-hover": "#0077ed",
        "apple-gray": "#86868b",
        "apple-dark": "#1d1d1f",
        "apple-light": "#f5f5f7",
        "surface-glass": "rgba(17, 24, 39, 0.6)",
        "surface-card": "#ffffff",
        "border-soft": "rgba(0, 0, 0, 0.06)",
        "accent-primary": "#0071e3",
        "accent-secondary": "#0077ed"
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        "glass-hover": "0 12px 40px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
        card: "0 4px 16px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
        "card-hover": "0 8px 24px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.03)",
        button: "0 1px 3px rgba(0, 0, 0, 0.1)",
        "button-hover": "0 2px 6px rgba(0, 113, 227, 0.25)"
      },
      borderRadius: {
        glass: "24px",
        card: "18px",
        frame: "28px",
        "apple-button": "980px"
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif']
      },
      letterSpacing: {
        'apple': '-0.011em'
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.4, 0, 0.2, 1)'
      },
      transitionDuration: {
        'apple': '250ms',
        'apple-slow': '500ms'
      }
    }
  },
  plugins: []
};


