import { defineStore } from 'pinia'

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

  return {
    isSidebarOpen,
    isMobileMenuOpen,
    isLoading,
    themeMode,
    primaryColor,
    toggleSidebar,
    closeMobileMenu,
    openMobileMenu,
    setThemeMode,
    setPrimaryColor,
    setLoading(val: boolean) {
      isLoading.value = val
    }
  }
})
