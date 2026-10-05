/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/app/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6B46C1', // Sleek, dark professional purple
          dark: '#522DA8',
          light: '#805AD5',
        },
        secondary: {
          DEFAULT: '#5B30D9',
        },
        tertiary: {
          DEFAULT: '#EDE9FE',
        },
        neutral: {
          DEFAULT: '#14121F',
          dark: '#0F0E17',
          muted: '#797587',
        },
        screenBg: '#F6F4FF',
        cardBg: '#FFFFFF',
        inputBg: '#FAF8FF',
        borderBg: '#EDE9FE',
      },
      fontFamily: {
        sans: ['DMSans_400Regular', 'sans-serif'],
        regular: ['DMSans_400Regular', 'sans-serif'],
        medium: ['DMSans_500Medium', 'sans-serif'],
        semibold: ['DMSans_600SemiBold', 'sans-serif'],
        bold: ['DMSans_700Bold', 'sans-serif'],
        extrabold: ['DMSans_800ExtraBold', 'sans-serif'],
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
