module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        ink: '#0F172A',
        muted: '#64748B',
        canvas: '#F8FAFC',
        line: '#E2E8F0',
        success: '#15803D',
        warning: '#B45309',
        danger: '#DC2626',
      },
    },
  },
  plugins: [],
};
