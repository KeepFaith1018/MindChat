<script setup lang="ts">
import { useChatStore } from '~/stores/useChatStore'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const props = defineProps<{
  collapsed?: boolean
  mode?: 'desktop' | 'mobile'
}>()
console.log('Sidebar props:', props)
const appStore = useAppStore()
const chatStore = useChatStore()
const authStore = useAuthStore()
const { themeMode, setThemeMode, primaryColor, setPrimaryColor, modes, colors } = useTheme()

// 编辑状态
const editingId = ref<string | null>(null)
const editingTitle = ref('')

// 初始化加载会话
onMounted(() => {
  // 只有在 store 中没数据时才加载，避免覆盖 SSR 预取的数据
  if (chatStore.conversations.length === 0) {
    chatStore.loadConversations()
  }
})

function handleNewChat() {
  chatStore.createConversation()
  // 在移动端点击后自动关闭侧边栏
  if (appStore.isMobileMenuOpen) {
    appStore.closeMobileMenu()
  }
}

function handleSelectChat(id: string) {
  // 如果正在编辑，不触发选择
  if (editingId.value === id) return

  if (chatStore.currentConversationId === id) return
  chatStore.loadConversation(id)
  if (appStore.isMobileMenuOpen) {
    appStore.closeMobileMenu()
  }
}

function handleDeleteChat(e: Event, id: string) {
  e.stopPropagation()
  // Confirm?
  chatStore.deleteConversation(id)
}

function handleEditChat(e: Event, id: string, title: string) {
  e.stopPropagation()
  editingId.value = id
  editingTitle.value = title

  // 自动聚焦
  nextTick(() => {
    const input = document.getElementById(`edit-input-${id}`)
    input?.focus()
  })
}

function handleSaveTitle(id: string) {
  if (!editingId.value) return

  if (editingTitle.value.trim()) {
    chatStore.updateConversation(id, { title: editingTitle.value.trim() })
  }

  editingId.value = null
  editingTitle.value = ''
}

function handleCancelEdit() {
  editingId.value = null
  editingTitle.value = ''
}

// 格式化时间
const formatTime = (dateStr: string) => {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: zhCN })
  } catch (e) {
    console.error('Failed to format time:', e)
    return ''
  }
}

// 用户菜单项
const userMenuItems = computed(() => [
  [
    {
      label: authStore.user?.name || authStore.user?.email || 'Guest',
      avatar: {
        src: authStore.user?.avatarUrl || '',
        alt: authStore.user?.name || 'User'
      },
      type: 'label'
    }
  ],
  [
    {
      label: '外观',
      icon: 'i-lucide-palette',
      children: modes.map((m) => ({
        label: m.label,
        icon: m.icon,
        type: 'radio' as const,
        checked: themeMode.value === m.value,
        class:
          themeMode.value === m.value
            ? 'bg-primary-50/50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 font-medium rounded-lg'
            : '',
        onSelect: (e: Event) => {
          e.preventDefault()
          setThemeMode(m.value as any)
        }
      }))
    },
    {
      label: '主题色',
      icon: 'i-lucide-paint-bucket',
      children: colors.map((c) => ({
        label: c.label,
        icon: primaryColor.value === c.value ? 'i-lucide-check-circle-2' : 'i-lucide-circle',
        iconClass:
          primaryColor.value === c.value
            ? `text-${c.value}-600 dark:text-${c.value}-400`
            : `text-${c.value}-500`,
        type: 'radio' as const,
        checked: primaryColor.value === c.value,
        class:
          primaryColor.value === c.value
            ? `bg-${c.value}-50/50 dark:bg-${c.value}-950/30 text-${c.value}-600 dark:text-${c.value}-400 font-medium rounded-lg`
            : '',
        onSelect: (e: Event) => {
          e.preventDefault()
          setPrimaryColor(c.value)
        }
      }))
    }
  ],
  [
    {
      label: '退出登录',
      icon: 'i-lucide-log-out',
      onSelect: () => authStore.logout()
    }
  ]
])
</script>

<template>
  <div class="flex h-full w-full flex-col bg-gray-50/50 dark:bg-gray-900/50">
    <!-- Logo / 品牌 -->
    <div class="flex h-14 shrink-0 items-center px-4">
      <div v-if="!collapsed" class="text-primary-500 flex items-center gap-2 text-xl font-bold">
        <UIcon name="i-lucide-bot" class="h-6 w-6" />
        <span>MindChat</span>
      </div>
      <div v-else class="flex w-full justify-center">
        <UIcon name="i-lucide-bot" class="text-primary-500 h-6 w-6" />
      </div>
    </div>

    <!-- 新建对话按钮 -->
    <div class="px-3 py-2">
      <UButton
        :icon="collapsed ? 'i-lucide-plus' : 'i-lucide-plus'"
        :label="collapsed ? '' : '新对话'"
        :loading="chatStore.isCreatingConversation"
        :disabled="chatStore.isCreatingConversation || chatStore.isDraftConversation"
        color="primary"
        variant="solid"
        class="w-full justify-center rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        @click="handleNewChat"
      />
    </div>

    <!-- 历史记录列表 -->
    <div class="scrollbar-thin flex-1 overflow-y-auto px-3 py-2">
      <div
        v-if="!collapsed && chatStore.conversations.length > 0"
        class="mb-2 px-2 text-xs font-medium text-gray-400"
      >
        最近对话
      </div>

      <div class="space-y-1">
        <div
          v-for="chat in chatStore.conversations"
          :key="chat.id"
          class="group relative flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          :class="[
            chatStore.currentConversationId === chat.id
              ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400 font-medium'
              : 'text-gray-600 dark:text-gray-300'
          ]"
          @click="handleSelectChat(chat.id)"
        >
          <UIcon
            :name="
              chatStore.currentConversationId === chat.id
                ? 'i-lucide-message-square'
                : 'i-lucide-message-square'
            "
            class="h-4 w-4 shrink-0 opacity-70"
          />

          <div v-if="!collapsed" class="flex min-w-0 flex-1 flex-col">
            <!-- 正常显示标题 -->
            <template v-if="editingId !== chat.id">
              <span class="truncate text-sm">{{ chat.title }}</span>
              <span class="truncate text-[10px] opacity-50">{{ formatTime(chat.updatedAt) }}</span>
            </template>
            <!-- 编辑模式 -->
            <div v-else class="flex items-center gap-1" @click.stop>
              <input
                :id="`edit-input-${chat.id}`"
                v-model="editingTitle"
                type="text"
                class="border-primary-200 focus:border-primary-500 dark:border-primary-800 w-full rounded border bg-white px-1 py-0.5 text-xs focus:outline-none dark:bg-gray-900"
                @blur="handleSaveTitle(chat.id)"
                @keydown.enter="handleSaveTitle(chat.id)"
                @keydown.esc="handleCancelEdit"
              >
            </div>
          </div>

          <!-- 操作按钮组 (Hover显示) -->
          <div
            v-if="!collapsed && editingId !== chat.id"
            class="absolute right-2 hidden items-center gap-1 bg-white/80 pl-1 group-hover:flex dark:bg-gray-800/80"
          >
            <UButton
              icon="i-lucide-pencil"
              color="neutral"
              variant="ghost"
              size="xs"
              :padded="false"
              class="opacity-60 hover:opacity-100"
              @click="(e) => handleEditChat(e, chat.id, chat.title)"
            />
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="xs"
              :padded="false"
              class="opacity-60 hover:opacity-100"
              @click="(e) => handleDeleteChat(e, chat.id)"
            />
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-if="chatStore.conversations.length === 0 && !collapsed"
        class="flex flex-col items-center justify-center py-8 text-center text-gray-400"
      >
        <UIcon name="i-lucide-history" class="mb-2 h-8 w-8 opacity-20" />
        <span class="text-xs">暂无历史记录</span>
      </div>
    </div>

    <!-- 底部用户菜单 -->
    <div class="mt-auto border-t border-gray-100 p-3 dark:border-gray-800">
      <UDropdownMenu :items="userMenuItems" :popper="{ placement: 'top-end' }" class="w-full">
        <button
          class="flex w-full items-center gap-3 rounded-xl p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <UAvatar
            :src="authStore.user?.avatarUrl || ''"
            :alt="authStore.user?.name || 'User'"
            size="sm"
            class="bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300"
          />
          <div v-if="!collapsed" class="flex min-w-0 flex-1 flex-col text-left">
            <span class="truncate text-sm font-medium text-gray-700 dark:text-gray-200">
              {{ authStore.user?.name || 'Guest' }}
            </span>
            <span class="truncate text-xs text-gray-400">{{ authStore.user?.email }}</span>
          </div>
          <UIcon v-if="!collapsed" name="i-lucide-chevrons-up-down" class="h-4 w-4 text-gray-400" />
        </button>
      </UDropdownMenu>
    </div>
  </div>
</template>
