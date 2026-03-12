<script setup lang="ts">
const appStore = useAppStore()
const { isDesktop } = useBreakpoint()

function handleToggleSidebar() {
  if (isDesktop.value) {
    appStore.toggleSidebar()
  } else {
    appStore.openMobileMenu()
  }
}

// 分享功能模拟
function handleShare() {
  // TODO: 实现分享功能
  console.log('Share clicked')
}
</script>

<template>
  <header
    class="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-gray-100 bg-white/80 px-4 backdrop-blur-md transition-all dark:border-gray-800/50 dark:bg-gray-950/80"
  >
    <div class="flex items-center gap-3">
      <UButton icon="i-lucide-menu" variant="ghost" color="neutral" @click="handleToggleSidebar" />
    </div>

    <div class="flex items-center gap-2">
      <UButton icon="i-lucide-share" variant="ghost" color="neutral" @click="handleShare" />
    </div>
  </header>
</template>
