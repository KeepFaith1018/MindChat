import { defineStore, skipHydrate } from 'pinia'

export const useAppStore = defineStore('app', () => {
  // Sidebar
  const isSidebarOpen = useStorage('mindchat-sidebar-open', true)

  // Mobile Menu
  const isMobileMenuOpen = ref(false)

  // Loading
  const isLoading = ref(true)

  // Theme
  const themeMode = useStorage<'system' | 'light' | 'dark'>('mindchat-theme-mode', 'system')

  const primaryColor = useStorage('mindchat-primary-color', 'violet')

  function toggleSidebar() {
    isSidebarOpen.value = !isSidebarOpen.value
  }

  function openMobileMenu() {
    isMobileMenuOpen.value = true
  }

  function closeMobileMenu() {
    isMobileMenuOpen.value = false
  }

  function setThemeMode(mode: 'system' | 'light' | 'dark') {
    themeMode.value = mode
  }

  function setPrimaryColor(color: string) {
    primaryColor.value = color
  }

  function setLoading(val: boolean) {
    isLoading.value = val
  }

  return {
    // UI State
    isSidebarOpen: skipHydrate(isSidebarOpen),
    isMobileMenuOpen,
    isLoading,

    // Theme
    themeMode: skipHydrate(themeMode),
    primaryColor: skipHydrate(primaryColor),

    // Actions
    toggleSidebar,
    openMobileMenu,
    closeMobileMenu,
    setThemeMode,
    setPrimaryColor,
    setLoading
  }
})
