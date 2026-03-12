/**
 * 管理应用主题（深色/浅色/跟随系统）的自定义钩子。
 * 封装 Nuxt UI 的颜色模式和 Tailwind 配置。
 */
export function useTheme() {
  const colorMode = useColorMode()
  const appConfig = useAppConfig()
  const appStore = useAppStore()

  // 可用的主题模式
  const modes = [
    { value: 'system', label: '跟随系统', icon: 'i-lucide-monitor' },
    { value: 'light', label: '亮色模式', icon: 'i-lucide-sun' },
    { value: 'dark', label: '暗色模式', icon: 'i-lucide-moon' }
  ]

  // 可用的主题色
  const colors = [
    { value: 'indigo', label: '靛蓝', hex: '#6366f1' },
    { value: 'blue', label: '天空蓝', hex: '#3b82f6' },
    { value: 'green', label: '翡翠绿', hex: '#10b981' },
    { value: 'violet', label: '罗兰紫', hex: '#8b5cf6' },
    { value: 'orange', label: '活力橙', hex: '#f97316' },
    { value: 'rose', label: '玫瑰红', hex: '#f43f5e' },
    { value: 'slate', label: '水墨灰', hex: '#64748b' }
  ]

  // 监听 Store 中的状态变化并同步到 UI
  watch(
    () => appStore.themeMode,
    (newMode) => {
      colorMode.preference = newMode
    },
    { immediate: true }
  )

  watch(
    () => appStore.primaryColor,
    (newColor) => {
      if (appConfig.ui) {
        // @ts-ignore
        appConfig.ui.colors.primary = newColor
      }
    },
    { immediate: true }
  )

  // 当前状态
  const isDark = computed(() => colorMode.value === 'dark')

  /**
   * 设置主题模式
   * @param mode {'system' | 'light' | 'dark'}
   */
  const setThemeMode = (mode: 'system' | 'light' | 'dark') => {
    appStore.setThemeMode(mode)
  }

  /**
   * 设置主题色
   * @param color {string}
   */
  const setPrimaryColor = (color: string) => {
    appStore.setPrimaryColor(color)
  }

  return {
    isDark,
    themeMode: computed(() => appStore.themeMode),
    primaryColor: computed(() => appStore.primaryColor),
    modes,
    colors,
    setThemeMode,
    setPrimaryColor
  }
}
