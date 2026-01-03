/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Door County inspired palette
        // Deep lake blue, cherry red, forest green, sandy beach
        'dc': {
          'lake': {
            50: '#e6f3f7',
            100: '#cce7ef',
            200: '#99cfdf',
            300: '#66b7cf',
            400: '#339fbf',
            500: '#1a7a9c', // Primary lake blue
            600: '#156280',
            700: '#104a60',
            800: '#0b3140',
            900: '#051920',
          },
          'cherry': {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#c41e3a', // Door County cherry red
            600: '#a31830',
            700: '#821226',
            800: '#610d1c',
            900: '#410812',
          },
          'forest': {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#2d5a3d', // Forest green
            600: '#254a32',
            700: '#1d3a27',
            800: '#142a1c',
            900: '#0c1a11',
          },
          'sand': {
            50: '#fefdfb',
            100: '#fdf9f3',
            200: '#faf3e7',
            300: '#f5e6cf',
            400: '#e8d4b0',
            500: '#d4bc8a', // Sandy beach
            600: '#b39a6a',
            700: '#8a7750',
            800: '#615438',
            900: '#3a3221',
          },
        },
      },
      fontFamily: {
        // Display font - distinctive, memorable
        'display': ['Playfair Display', 'Georgia', 'serif'],
        // Body font - clean, readable
        'body': ['Source Sans 3', 'system-ui', 'sans-serif'],
        // Accent font - for navigation, buttons
        'accent': ['DM Sans', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-lake': 'linear-gradient(135deg, #1a7a9c 0%, #104a60 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #f87171 0%, #c41e3a 50%, #1a7a9c 100%)',
        'texture-paper': "url('/textures/paper.png')",
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(26, 122, 156, 0.1), 0 2px 4px -1px rgba(26, 122, 156, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(26, 122, 156, 0.1), 0 4px 6px -2px rgba(26, 122, 156, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
