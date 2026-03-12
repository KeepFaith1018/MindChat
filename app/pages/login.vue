<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

/**
 * Login Page - 认证页面 (登录/注册)
 *
 * 职责：
 * - 提供登录和注册表单切换。
 * - 支持 GitHub/Google 第三方登录（UI 展示）。
 * - 处理表单校验与模拟登录逻辑。
 *
 * @module app/pages/login
 */

definePageMeta({
  layout: false
})

const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()

onMounted(() => {
  // 进入登录页后，确保 Loading 状态关闭
  appStore.setLoading(false)
})

// 状态
const isLoading = ref(false)
const items = [
  { label: '登录', icon: 'i-lucide-log-in', value: 'login' },
  { label: '注册', icon: 'i-lucide-user-plus', value: 'register' }
]
const activeTab = ref('login')

// 表单架构 (Zod)
const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码长度至少为 6 位')
})

const registerSchema = z
  .object({
    name: z.string().min(2, '昵称至少为 2 位'),
    email: z.string().email('请输入有效的邮箱地址'),
    password: z.string().min(6, '密码长度至少为 6 位'),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword']
  })

type LoginSchema = z.output<typeof loginSchema>
type RegisterSchema = z.output<typeof registerSchema>

const loginState = reactive({
  email: '',
  password: ''
})

const registerState = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

/**
 * 处理登录提交
 */
async function onLoginSubmit(event: FormSubmitEvent<LoginSchema>) {
  isLoading.value = true
  try {
    await authStore.login(event.data)
    handleSuccessRedirect()
  } catch (error) {
    console.error('Login failed:', error)
  } finally {
    isLoading.value = false
  }
}

/**
 * 处理注册提交
 */
async function onRegisterSubmit(event: FormSubmitEvent<RegisterSchema>) {
  isLoading.value = true
  try {
    await authStore.register(event.data)
    handleSuccessRedirect()
  } catch (error) {
    console.error('Register failed:', error)
  } finally {
    isLoading.value = false
  }
}

/**
 * 成功后重定向
 */
function handleSuccessRedirect() {
  const redirectPath = (route.query.redirect as string) || '/chat'
  // 登录成功后直接跳转，不手动开启全屏 Loading，减少感知延迟
  navigateTo(redirectPath)
}

/**
 * 第三方登录模拟
 */
function handleSocialLogin(provider: string) {
  isLoading.value = true
  // 模拟 OAuth 跳转流程
  setTimeout(() => {
    authStore.login({ email: `social-${provider}@example.com` })
    handleSuccessRedirect()
  }, 1000)
}
</script>

<template>
  <div
    class="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 dark:bg-gray-950"
  >
    <!-- 背景装饰光晕 -->
    <div
      class="bg-primary-500/5 absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full blur-[120px]"
    />
    <div
      class="absolute -right-[10%] -bottom-[10%] h-[40%] w-[40%] rounded-full bg-blue-500/5 blur-[120px]"
    />

    <div class="z-10 w-full max-w-md">
      <!-- Logo & 标题 -->
      <div class="mb-8 flex flex-col items-center text-center">
        <div class="relative mb-4 flex h-16 w-16 items-center justify-center">
          <div class="bg-primary-500/10 absolute inset-0 animate-pulse rounded-full blur-xl"/>
          <UIcon name="i-lucide-bot" class="text-primary-500 h-12 w-12" />
        </div>
        <h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">MindChat</h1>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">极简、智能的 AI 对话助手</p>
      </div>

      <!-- 认证卡片 -->
      <UCard
        class="overflow-hidden rounded-3xl border-none bg-white/70 shadow-2xl backdrop-blur-xl dark:bg-gray-900/70"
        :ui="{
          body: 'p-6 sm:p-8'
        }"
      >
        <UTabs v-model="activeTab" :items="items" class="w-full">
          <template #content="{ item }">
            <div v-if="item.value === 'login'" class="space-y-4 py-4">
              <UForm
                :schema="loginSchema"
                :state="loginState"
                class="space-y-4"
                @submit="onLoginSubmit"
              >
                <UFormField label="邮箱" name="email">
                  <UInput
                    v-model="loginState.email"
                    placeholder="you@example.com"
                    icon="i-lucide-mail"
                    class="w-full rounded-xl"
                    size="lg"
                  />
                </UFormField>

                <UFormField label="密码" name="password">
                  <UInput
                    v-model="loginState.password"
                    type="password"
                    placeholder="••••••••"
                    icon="i-lucide-lock"
                    class="w-full rounded-xl"
                    size="lg"
                  />
                </UFormField>

                <UButton
                  type="submit"
                  block
                  size="xl"
                  label="登录"
                  :loading="isLoading"
                  class="rounded-xl font-bold"
                />
              </UForm>
            </div>

            <div v-else class="space-y-4 py-4">
              <UForm
                :schema="registerSchema"
                :state="registerState"
                class="space-y-4"
                @submit="onRegisterSubmit"
              >
                <UFormField label="昵称" name="name">
                  <UInput
                    v-model="registerState.name"
                    placeholder="您的昵称"
                    icon="i-lucide-user"
                    class="w-full rounded-xl"
                    size="lg"
                  />
                </UFormField>

                <UFormField label="邮箱" name="email">
                  <UInput
                    v-model="registerState.email"
                    placeholder="you@example.com"
                    icon="i-lucide-mail"
                    class="w-full rounded-xl"
                    size="lg"
                  />
                </UFormField>

                <UFormField label="密码" name="password">
                  <UInput
                    v-model="registerState.password"
                    type="password"
                    placeholder="••••••••"
                    icon="i-lucide-lock"
                    class="w-full rounded-xl"
                    size="lg"
                  />
                </UFormField>

                <UFormField label="确认密码" name="confirmPassword">
                  <UInput
                    v-model="registerState.confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    icon="i-lucide-shield-check"
                    class="w-full rounded-xl"
                    size="lg"
                  />
                </UFormField>

                <UButton
                  type="submit"
                  block
                  size="xl"
                  label="注册账号"
                  :loading="isLoading"
                  class="rounded-xl font-bold"
                />
              </UForm>
            </div>
          </template>
        </UTabs>

        <!-- 分隔线 -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200 dark:border-gray-800"/>
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-white px-2 text-gray-500 dark:bg-gray-900">或者使用</span>
          </div>
        </div>

        <!-- 第三方登录 -->
        <div class="grid grid-cols-2 gap-4">
          <UButton
            color="neutral"
            variant="subtle"
            label="GitHub"
            icon="i-lucide-github"
            block
            class="rounded-xl"
            @click="handleSocialLogin('github')"
          />
          <UButton
            color="neutral"
            variant="subtle"
            label="Google"
            icon="i-lucide-chrome"
            block
            class="rounded-xl"
            @click="handleSocialLogin('google')"
          />
        </div>
      </UCard>

      <!-- 返回首页 -->
      <div class="mt-8 text-center">
        <NuxtLink
          to="/"
          class="hover:text-primary-500 text-sm font-medium text-gray-500 transition-colors"
        >
          ← 返回首页
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
