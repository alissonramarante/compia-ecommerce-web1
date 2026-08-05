/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    /* Substitui (não estende) a paleta do Tailwind. Só existem os seis tokens
       da direção visual, mais os quatro valores estruturais que utilitárias
       internas do framework resolvem via `theme('colors.…')`.
       Consequência desejada: `bg-gray-100` e `text-slate-600` deixam de
       compilar em silêncio — a regra "usar só estes tokens" passa a ser
       garantida pelo build, não por disciplina. */
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
      white: '#FFFFFF',
      black: '#000000',

      tinta: '#101418',
      papel: '#EEF0EA',
      azul: '#23319E',
      riso: '#FF4F7B',
      ocre: '#D9A521',
      grafite: '#5C6670',

      /* Versões escurecidas de riso/ocre, só para `text-*`. `riso` e `ocre`
         puros não passam de ~2,8:1 sobre papel/white como cor de texto —
         falham WCAG AA (4.5:1). Estas mantêm a matiz e escurecem até bater
         4.5:1 contra os dois fundos claros do tema (calculado pela fórmula
         de luminância relativa, ver CLAUDE.md § Direção visual). Nunca usar
         como fundo — para isso o acento é o token cheio, com texto tinta
         por cima. */
      'riso-texto': '#BE3A5C',
      'ocre-texto': '#8A6414',
    },
    /* Sobrescreve o borderRadius padrão: o tema inteiro fica limitado a 4px,
       conforme a direção visual. `rounded-full`, `rounded-xl` e afins deixam
       de existir de propósito. */
    borderRadius: {
      none: '0px',
      sm: '1px',
      DEFAULT: '2px',
      md: '3px',
      lg: '4px',
    },
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        corpo: ['"Source Serif 4"', 'Georgia', 'ui-serif', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};
