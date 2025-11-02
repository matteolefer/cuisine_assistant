export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sage: '#6b7c64',
        linen: '#f6f5f2',
        sand: '#e3ddc8',
        charcoal: '#2f2f2f',
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};