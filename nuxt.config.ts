export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  ssr: false,
  srcDir: 'app',
  css: ['~/assets/css/main.css'],
  modules: ['@pinia/nuxt'],
  components: {
    dirs: [{ path: '~/components', extensions: ['vue'] }]
  },
  routeRules: {
    '/': { redirect: '/recipes' }
  }
})
