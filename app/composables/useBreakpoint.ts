/**
 * 响应式断点的自定义钩子。
 * 跟踪窗口大小并为不同屏幕尺寸提供响应式布尔标志。
 */
export function useBreakpoint() {
  // 定义断点（匹配 Tailwind 默认值）
  const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  }

  // 响应式状态
  const windowWidth = ref(0)

  // 方便使用的计算属性
  const isMobile = computed(() => {
    if (!import.meta.client) return false
    return windowWidth.value < breakpoints.md
  })
  const isTablet = computed(() => {
    if (!import.meta.client) return false
    return windowWidth.value >= breakpoints.md && windowWidth.value < breakpoints.lg
  })
  const isDesktop = computed(() => {
    if (!import.meta.client) return true // 服务端渲染默认认为是桌面端，避免内容跳动
    return windowWidth.value >= breakpoints.lg
  })

  // 带有节流的调整大小处理程序可能会更好，但简单的监听器对于 MVP 来说已经足够了
  const handleResize = () => {
    windowWidth.value = window.innerWidth
  }

  if (import.meta.client) {
    // 初始化
    handleResize()

    // 添加监听器
    window.addEventListener('resize', handleResize, { passive: true })

    // 清理
    try {
      onUnmounted(() => {
        window.removeEventListener('resize', handleResize)
      })
    } catch {
      // 如果在组件外部则忽略
    }
  }

  return {
    windowWidth,
    isMobile,
    isTablet,
    isDesktop,
    breakpoints
  }
}
