/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'eco-bg': '#EFF7EC',
        'eco-bg2': '#F7FBF5',
        'eco-white': '#FFFFFF',
        'eco-primary': '#2D6A4F',
        'eco-primary-d': '#1B4332',
        'eco-accent': '#52B788',
        'eco-light': '#D8F3DC',
        'eco-light2': '#B7E4C7',
        'eco-border': '#C3DFC9',
        'eco-text': '#1B4332',
        'eco-muted': '#5A8A6E',
        'eco-warm': '#E76F51',
        'eco-amber': '#F4A261',
        'eco-danger': '#D62828',
        'eco-blue': '#457B9D',
      },
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],
        dm: ['DM Sans', 'sans-serif'],
      },
      boxShadow: {
        'eco': '0 2px 16px rgba(45,106,79,0.10)',
        'eco-lg': '0 8px 40px rgba(45,106,79,0.14)',
      },
    },
  },
  plugins: [],
};
