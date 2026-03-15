import { fileURLToPath } from 'node:url'
import { defineNuxtConfig } from 'nuxt/config'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devServer: {
    port: 3000
  },
  // 使用 routeRules 配置代理，解决开发环境跨域和路由冲突问题
  routeRules: {
    '/v1/**': {
      proxy: 'http://localhost:3001/v1/**'
    }
  },
  future: {
    compatibilityVersion: 4
  },
  alias: {
    share: fileURLToPath(new URL('./share', import.meta.url))
  },
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/ui', '@pinia/nuxt'],
  ui: {
    fonts: false
  },
  colorMode: {
    classSuffix: ''
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      appName: process.env.NUXT_PUBLIC_APP_NAME,
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/v1',
      apiAllBase: process.env.NUXT_PUBLIC_API_ALL_BASE || 'http://localhost:3001/v1'
    }
  }
})
