<script setup lang="ts">
/**
 * LandingPage - 首页落地页组件
 *
 * 职责：纯展示型组件，负责渲染吸引用户的内容。
 * 包含 Hero Section、功能介绍、号召性按钮等。
 */

const appStore = useAppStore()

function handleStart() {
  // 显示全屏 Loading
  appStore.setLoading(true)
  navigateTo('/chat')
}
</script>

<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center bg-white px-4 dark:bg-gray-950"
  >
    <div class="max-w-4xl text-center">
      <div class="mb-6 flex justify-center">
        <div class="relative flex h-24 w-24 items-center justify-center">
          <div class="bg-primary-500/10 absolute inset-0 animate-pulse rounded-full blur-2xl"/>
          <UIcon name="i-lucide-bot" class="text-primary-500 h-20 w-20" />
        </div>
      </div>

      <h1
        class="mb-6 text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl dark:text-gray-100"
      >
        MindChat <span class="text-primary-500">智能 AI 助手</span>
      </h1>

      <p class="mx-auto mb-10 max-w-2xl text-xl text-gray-600 dark:text-gray-400">
        一个快速、智能且私密的 AI
        对话平台。支持多种主流大语言模型，帮助您提高工作效率，激发无限灵感。
      </p>

      <div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
        <UButton
          size="xl"
          label="立即开始对话"
          icon="i-lucide-sparkles"
          class="rounded-2xl px-8 py-4 text-lg font-bold shadow-xl transition-all hover:scale-105"
          @click="handleStart"
        />

        <UButton
          variant="ghost"
          color="neutral"
          size="xl"
          label="了解更多功能"
          class="rounded-2xl px-8 py-4 text-lg font-medium"
        />
      </div>

      <!-- 底部装饰性图标 -->
      <div class="mt-20 grid grid-cols-2 gap-8 sm:grid-cols-4">
        <div class="flex flex-col items-center gap-2">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500"
          >
            <UIcon name="i-lucide-zap" class="h-6 w-6" />
          </div>
          <span class="text-sm font-medium text-gray-500">极速响应</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-500"
          >
            <UIcon name="i-lucide-shield-check" class="h-6 w-6" />
          </div>
          <span class="text-sm font-medium text-gray-500">数据安全</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500"
          >
            <UIcon name="i-lucide-code" class="h-6 w-6" />
          </div>
          <span class="text-sm font-medium text-gray-500">深度理解</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500"
          >
            <UIcon name="i-lucide-palette" class="h-6 w-6" />
          </div>
          <span class="text-sm font-medium text-gray-500">创意无限</span>
        </div>
      </div>
    </div>
  </div>
</template>
