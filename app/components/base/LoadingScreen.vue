<script setup lang="ts">
const appStore = useAppStore()
const { isLoading } = storeToRefs(appStore)

// 挂载时显示加载，仅用于应用初次启动
onMounted(() => {
  // 如果是应用初次挂载（通常 isLoading 初始值为 true）
  // 保持一个极短的展示时间防止首屏闪烁，然后自动关闭
  if (appStore.isLoading) {
    setTimeout(() => {
      isLoading.value = false
    }, 400)
  }
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-500 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isLoading"
      class="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-950"
    >
      <div class="flex flex-col items-center gap-4">
        <!-- 脉冲 Logo -->
        <div class="relative flex items-center justify-center">
          <div class="bg-primary-500/20 absolute h-16 w-16 animate-ping rounded-full"/>
          <UIcon name="i-lucide-bot" class="text-primary-500 h-16 w-16 animate-pulse" />
        </div>
        <div class="text-sm font-medium text-gray-400">MindChat</div>
      </div>
    </div>
  </Transition>
</template>
