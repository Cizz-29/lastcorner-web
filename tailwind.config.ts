import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette estratta direttamente da Figma
        'lc-bg':       '#131318',
        'lc-header':   '#09090c',
        'lc-card':     '#141418',
        'lc-red':      '#FF3A3A',
        'lc-text':     '#FFFFFF',
        'lc-muted':    '#E5E5E5',
        'lc-subtle':   '#C3C3C3',
        'lc-border':   'rgba(255,255,255,0.6)',
      },
      fontFamily: {
        // Akira Expanded per titoli e nav
        'akira': ['Akira Expanded', 'sans-serif'],
        // Montserrat per metadata e testi
        'montserrat': ['Montserrat', 'sans-serif'],
      },
      borderRadius: {
        'card': '27px',
        'card-sm': '21px',
      },
      backgroundImage: {
        // Gradiente laterale per le card mini nella colonna destra
        'card-side-gradient': 'linear-gradient(to right, rgb(20,20,24) 1.5%, rgba(20,20,24,0.96) 13%, rgba(11,11,11,0.55) 27%, rgba(11,11,11,0) 32%)',
      },
    },
  },
  plugins: [],
}
export default config
