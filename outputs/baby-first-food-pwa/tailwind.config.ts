import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        cream: '#FFF8EE',
        peach: '#F7BFA8',
        peachDeep: '#E89D83',
        sage: '#A9C8A5',
        sageDeep: '#789B74',
        cocoa: '#6F5648',
        oat: '#F4E3CF',
        butter: '#FFE7A8',
        berry: '#C7788D',
        sky: '#BEE3F5',
        skyDeep: '#4E93AE',
      },
      boxShadow: {
        soft: '0 18px 50px rgba(111, 86, 72, 0.12)',
      },
    },
  },
  plugins: [],
} satisfies Config;
