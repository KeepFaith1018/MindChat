<script setup lang="ts">
definePageMeta({
  layout: false
})

const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

const status = ref<'loading' | 'success' | 'error'>('loading')
const errorMessage = ref('登录处理中，请稍候...')

onMounted(async () => {
  // 1. 检查是否有父窗口（弹窗模式）
  if (window.opener) {
    try {
      // 2. 通知父窗口成功（此时后端已经把 Cookie 种在浏览器里了）
      window.opener.postMessage({ type: 'AUTH_SUCCESS' }, window.location.origin)

      // 3. 延迟一小会儿关闭，确保消息发出
      setTimeout(() => {
        window.close()
      }, 500)
    } catch (e) {
      console.error('Post message failed:', e)
      // 回退逻辑：如果通信失败，尝试在当前窗口跳转
      const redirectPath = typeof route.query.redirect === 'string' ? route.query.redirect : '/chat'
      await navigateTo(redirectPath, { replace: true })
    }
  } else {
    // 4. 非弹窗模式（用户直接访问或刷新），走原有的同步逻辑
    const redirectPath = typeof route.query.redirect === 'string' ? route.query.redirect : '/chat'

    try {
      await authStore.fetchUser()

      if (!authStore.isLoggedIn) {
        throw new Error('未获取到用户登录状态')
      }

      status.value = 'success'
      await navigateTo(redirectPath, { replace: true })
    } catch (error: any) {
      status.value = 'error'
      errorMessage.value = error?.message || '第三方登录失败，请重试'
      toast.add({
        title: '登录失败',
        description: errorMessage.value,
        color: 'error'
      })
      await navigateTo('/login', { replace: true })
    }
  }
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-gray-950">
    <UCard class="w-full max-w-md rounded-2xl">
      <div class="flex flex-col items-center gap-4 py-6 text-center">
        <UIcon
          v-if="status === 'loading'"
          name="i-lucide-loader-circle"
          class="text-primary-500 h-10 w-10 animate-spin"
        />
        <UIcon
          v-else-if="status === 'success'"
          name="i-lucide-check-circle-2"
          class="h-10 w-10 text-green-500"
        />
        <UIcon v-else name="i-lucide-x-circle" class="h-10 w-10 text-red-500" />

        <p class="text-sm text-gray-600 dark:text-gray-300">
          {{
            status === 'loading'
              ? '正在同步登录信息...'
              : status === 'success'
                ? '登录成功，正在跳转...'
                : errorMessage
          }}
        </p>
      </div>
    </UCard>
  </div>
</template>
