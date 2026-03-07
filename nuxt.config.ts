import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  ssr: false,
  srcDir: 'app',
  css: ['~/assets/css/main.css'],
  modules: ['@pinia/nuxt'],
  vite: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plugins: [...tailwindcss()] as any
  },
  components: {
    dirs: [{ path: '~/components', extensions: ['vue'] }]
  },
  routeRules: {
    '/': { redirect: '/recipes' }
  }
})
