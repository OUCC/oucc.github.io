/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: '#1a2872',
        secondary: '#f1f2f7',
        discord: '#5865F2',
      },
      dropShadow: {
        contrast: '0 2px 2px rgba(0, 0, 0, 0.25)',
      },
    },
  },
}
