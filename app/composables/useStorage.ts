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
    const setupStorage = () => {
      // 尝试从 localStorage 加载
      try {
        const storedValue = localStorage.getItem(key)
        if (storedValue !== null) {
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

      // 清理逻辑
      const cleanup = () => {
        window.removeEventListener('storage', handleStorage)
      }

      // 安全地注册清理逻辑
      try {
        // Pinia Store 和 Vue 组件都有 EffectScope，这是更通用的清理方式
        onScopeDispose(cleanup)
      } catch {
        // 如果不在任何 Scope 中，尝试在组件卸载时清理
        if (getCurrentInstance()) {
          onUnmounted(cleanup)
        }
      }
    }

    /**
     * 为了解决 Hydration Mismatch：
     * 必须确保在客户端水合（Initial Render）完成后再修改状态。
     */
    if (getCurrentInstance()) {
      // 在组件中调用时，等待挂载完成
      onMounted(setupStorage)
    } else {
      // 在 Store 等全局环境调用时，使用 setTimeout(0) 将任务推迟到下一个事件循环，
      // 此时水合过程已经结束。
      setTimeout(setupStorage, 0)
    }
  }

  return data
}
