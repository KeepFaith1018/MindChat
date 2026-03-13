import { defineStore, skipHydrate } from 'pinia'
import { ref, watch } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 使用我们的自定义存储钩子进行持久化
  // 注意：我们将状态与 localStorage 同步
  const sidebarOpenState = useStorage('mindchat-sidebar-open', true)

  // 如果不进行适当的解包，我们无法轻松地在 Pinia 内部直接对所有内容使用 useStorage
  // 所以我们要用它来初始化和同步
  const isSidebarOpen = ref(sidebarOpenState.value)

  // 更改时同步回存储
  watch(isSidebarOpen, (val) => {
    sidebarOpenState.value = val
  })

  // 仅在客户端：从存储同步回状态（以防 localStorage 中已有值）
  if (import.meta.client) {
    watch(
      sidebarOpenState,
      (val) => {
        if (isSidebarOpen.value !== val) {
          isSidebarOpen.value = val
        }
      },
      { immediate: true }
    )
  }

  // 移动端侧边栏状态
  const isMobileMenuOpen = ref(false)

  // 全局加载状态
  const isLoading = ref(true)

  // 主题配置
  const themeMode = useStorage<'system' | 'light' | 'dark'>('mindchat-theme-mode', 'system')
  const primaryColor = useStorage<string>('mindchat-primary-color', 'violet')

  // 操作
  function toggleSidebar() {
    isSidebarOpen.value = !isSidebarOpen.value
  }

  function setThemeMode(mode: 'system' | 'light' | 'dark') {
    themeMode.value = mode
  }

  function setPrimaryColor(color: string) {
    primaryColor.value = color
  }

  function closeMobileMenu() {
    isMobileMenuOpen.value = false
  }

  function openMobileMenu() {
    isMobileMenuOpen.value = true
  }
  function setLoading(val: boolean) {
    isLoading.value = val
  }
  return {
    isSidebarOpen: skipHydrate(isSidebarOpen),
    isMobileMenuOpen,
    isLoading,
    themeMode: skipHydrate(themeMode),
    primaryColor: skipHydrate(primaryColor),
    toggleSidebar,
    closeMobileMenu,
    openMobileMenu,
    setThemeMode,
    setPrimaryColor,
    setLoading
  }
})
