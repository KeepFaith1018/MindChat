<script setup lang="ts">
// 我们使用 store 来控制侧边栏状态
const appStore = useAppStore()
const { isMobile, isDesktop } = useBreakpoint()
const route = useRoute()

// 路由变化时自动关闭移动端侧边栏
watch(
  () => route.path,
  () => {
    if (isMobile.value) {
      appStore.closeMobileMenu()
    }
  }
)
</script>

<template>
  <div
    class="flex h-screen w-full overflow-hidden bg-gray-50 font-sans text-gray-900 dark:bg-gray-950 dark:text-gray-100"
  >
    <!-- 桌面端侧边栏 -->
    <aside
      v-if="isDesktop"
      class="flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900"
      :class="[appStore.isSidebarOpen ? 'w-64' : 'w-16']"
    >
      <LayoutSidebar :collapsed="!appStore.isSidebarOpen" />
    </aside>

    <!-- 移动端侧边栏（抽屉） -->
    <USlideover
      v-model:open="appStore.isMobileMenuOpen"
      side="left"
      :ui="{
        content: 'max-w-xs',
        overlay: 'bg-gray-950/20 backdrop-blur-sm'
      }"
    >
      <template #content>
        <div class="h-full w-full bg-white dark:bg-gray-900">
          <LayoutSidebar mode="mobile" />
        </div>
      </template>
    </USlideover>

    <!-- 主要内容区域 -->
    <div
      class="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-white dark:bg-gray-950"
    >
      <!-- 头部 -->
      <LayoutHeader class="shrink-0" />

      <!-- 页面内容 -->
      <main class="relative z-0 flex-1 overflow-y-auto scroll-smooth">
        <slot />
      </main>
    </div>
  </div>
</template>
