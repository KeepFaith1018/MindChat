<script setup lang="ts">
const emit = defineEmits<{
  send: [content: string]
}>()
const props = withDefaults(
  defineProps<{
    disabled?: boolean
  }>(),
  {
    disabled: false
  }
)

function handleSend(content: string) {
  if (props.disabled) return
  emit('send', content)
}
</script>

<template>
  <div class="flex min-h-full flex-col items-center justify-center px-4 py-10">
    <div class="mb-8 flex flex-col items-center gap-4">
      <div class="relative flex items-center justify-center">
        <div class="bg-primary-500/10 absolute h-20 w-20 animate-pulse rounded-full blur-xl" />
        <UIcon name="i-lucide-bot" class="text-primary-500 h-16 w-16" />
      </div>
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">MindChat</h1>
    </div>

    <ChatInputBox mode="centered" :disabled="props.disabled" @send="handleSend" />

    <div class="mt-8 flex flex-wrap justify-center gap-2">
      <UButton
        v-for="text in ['写一段 Python 代码', '解释量子纠缠', '帮我写个周报']"
        :key="text"
        :label="text"
        color="neutral"
        variant="subtle"
        size="xs"
        :disabled="props.disabled"
        class="rounded-full px-3 transition-transform hover:scale-105"
        @click="handleSend(text)"
      />
    </div>
  </div>
</template>
