<script setup lang="ts">
defineProps<{
  collapsed?: boolean
  mode?: 'desktop' | 'mobile'
}>()

const appStore = useAppStore()
const chatStore = useChatStore()
const { themeMode, setThemeMode, primaryColor, setPrimaryColor, modes, colors } = useTheme()

// 模拟历史数据
const recentChats = computed(() => chatStore.conversations)

function handleNewChat() {
  chatStore.createConversation()
  // 在移动端点击后自动关闭侧边栏
  if (appStore.isMobileMenuOpen) {
    appStore.closeMobileMenu()
  }
}

// 用户菜单项
const userMenuItems = computed(() => [
  [
    {
      label: 'Faith',
      avatar: {
        src: 'https://avatars.githubusercontent.com/u/739984?v=4',
        alt: 'Faith'
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
      click: () => console.log('Logout')
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
    <div class="shrink-0 p-3">
      <UButton
        block
        :icon="collapsed ? 'i-lucide-plus' : 'i-lucide-plus'"
        :label="collapsed ? '' : '新对话'"
        :class="[collapsed ? 'justify-center px-0' : '']"
        variant="solid"
        color="primary"
        size="lg"
        class="rounded-xl shadow-sm transition-all hover:shadow-md"
        @click="handleNewChat"
      />
    </div>

    <!-- 对话历史列表 -->
    <div class="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-2">
      <div
        v-if="!collapsed && recentChats.length > 0"
        class="px-2 py-2 text-xs font-medium text-gray-500 dark:text-gray-400"
      >
        最近对话
      </div>

      <template v-for="chat in recentChats" :key="chat.id">
        <UButton
          v-if="!collapsed"
          variant="ghost"
          color="neutral"
          block
          class="justify-start truncate rounded-xl text-left"
          :class="[
            chatStore.currentConversationId === chat.id
              ? 'bg-white shadow-sm dark:bg-white/5'
              : 'hover:bg-gray-100 dark:hover:bg-white/5'
          ]"
          @click="
            () => {
              chatStore.currentConversationId = chat.id
              if (appStore.isMobileMenuOpen) appStore.closeMobileMenu()
            }
          "
        >
          <span class="truncate">{{ chat.title }}</span>
        </UButton>

        <!-- Collapsed Icon View -->
        <UTooltip v-else :text="chat.title" placement="right">
          <UButton
            icon="i-lucide-message-square"
            variant="ghost"
            color="neutral"
            class="w-full justify-center rounded-xl"
            :class="[
              chatStore.currentConversationId === chat.id
                ? 'text-primary-500 bg-white shadow-sm dark:bg-white/5'
                : ''
            ]"
            @click="chatStore.currentConversationId = chat.id"
          />
        </UTooltip>
      </template>
    </div>

    <!-- User Profile (Bottom) -->
    <div class="shrink-0 border-t border-gray-100 p-3 dark:border-gray-800/50">
      <UDropdownMenu
        :items="userMenuItems"
        :ui="{ content: 'w-56 rounded-2xl shadow-xl' }"
        placement="top-start"
      >
        <UButton
          variant="ghost"
          color="neutral"
          block
          class="justify-start rounded-xl px-2 py-2 hover:bg-white hover:shadow-sm dark:hover:bg-white/5"
          :class="[collapsed ? 'justify-center px-0' : '']"
        >
          <UAvatar src="https://avatars.githubusercontent.com/u/739984?v=4" alt="Faith" size="sm" />
          <div
            v-if="!collapsed"
            class="flex flex-1 flex-col items-start gap-0.5 overflow-hidden text-left"
          >
            <span class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">Faith</span>
            <span class="truncate text-xs text-gray-500">Free Plan</span>
          </div>
          <UIcon v-if="!collapsed" name="i-lucide-chevron-up" class="h-4 w-4 text-gray-400" />
        </UButton>
      </UDropdownMenu>
    </div>
  </div>
</template>
