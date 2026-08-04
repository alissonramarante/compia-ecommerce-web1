/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    /* Sobrescreve (não estende) o borderRadius padrão: o tema inteiro fica
       limitado a 4px, conforme a direção visual. `rounded-full`, `rounded-xl`
       e afins deixam de existir de propósito. */
    borderRadius: {
      none: '0px',
      sm: '1px',
      DEFAULT: '2px',
      md: '3px',
      lg: '4px',
    },
    extend: {
      colors: {
        tinta: '#101418',
        papel: '#EEF0EA',
        azul: '#23319E',
        riso: '#FF4F7B',
        ocre: '#D9A521',
        grafite: '#5C6670',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        corpo: ['"Source Serif 4"', 'Georgia', 'ui-serif', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};
