// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  typescript: {
    strict: true,
    tsConfig: {
      compilerOptions: {
        skipLibCheck: true,
        paths: {
          'meta-assets/*': ['./*'],
          '@polkadot/api/augment': ['src/interfaces/augment-api.ts'],
          '@polkadot/types/augment': ['src/interfaces/augment-types.ts'],
        },
      },
    },
  },
  ssr: false,
  runtimeConfig: {
    apiSecret: '123',
    public: {
      apiBase: '/api',
    },
  },
  modules: [
    [
      '@pinia/nuxt',
      {
        autoImports: ['defineStore', 'acceptHMRUpdate'],
      },
    ],
    '@pinia-plugin-persistedstate/nuxt',
  ],
  imports: {
    dirs: ['stores'],
  },
  build: {
    transpile:
      process.env.NODE_ENV === 'production'
        ? [
            'naive-ui',
            'vueuc',
            '@css-render/vue3-ssr',
            '@juggle/resize-observer',
          ]
        : ['@juggle/resize-observer'],
  },
  vite: {
    optimizeDeps: {
      include:
        process.env.NODE_ENV === 'development'
          ? ['naive-ui', 'vueuc', 'date-fns-tz/esm/formatInTimeZone']
          : [],
    },
  },
})
