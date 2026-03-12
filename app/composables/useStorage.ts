/**
 * 带有响应式的 localStorage 持久化自定义钩子。
 * 类似于 VueUse 的 useStorage，但手动实现。
 *
 * @template T
 * @param {string} key - 存储在 localStorage 中的键
 * @param {T} initialValue - 如果存储中没有数据，则为初始值
 * @returns {Ref<T>} 与 localStorage 同步的响应式 ref
 */
export function useStorage<T>(key: string, initialValue: T) {
  // 创建一个带有初始值的响应式 ref
  const data = ref<T>(initialValue)

  // 仅在客户端运行以避免水合不匹配
  if (import.meta.client) {
    // 尝试在挂载时从 localStorage 加载
    try {
      const storedValue = localStorage.getItem(key)
      if (storedValue !== null) {
        // 如果可能，解析 JSON，否则使用字符串
        try {
          data.value = JSON.parse(storedValue)
        } catch {
          data.value = storedValue as unknown as T
        }
      }
    } catch (e) {
      console.warn(`Error reading localStorage key "${key}":`, e)
    }

    // 监听更改并更新 localStorage
    watch(
      data,
      (newValue) => {
        try {
          if (newValue === null || newValue === undefined) {
            localStorage.removeItem(key)
          } else {
            localStorage.setItem(key, JSON.stringify(newValue))
          }
        } catch (e) {
          console.warn(`Error writing localStorage key "${key}":`, e)
        }
      },
      { deep: true }
    )

    // 监听来自其他标签页的更改
    const handleStorage = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          data.value = JSON.parse(event.newValue)
        } catch {
          data.value = event.newValue as unknown as T
        }
      }
    }
    window.addEventListener('storage', handleStorage)

    // 卸载时清理监听器（如果在组件范围内使用）
    try {
      onUnmounted(() => {
        window.removeEventListener('storage', handleStorage)
      })
    } catch {
      // 如果在组件 setup 外部使用则忽略
    }
  }

  return data
}
