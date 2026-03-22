<script setup lang="ts">
import MarkdownRenderer from './MarkdownRenderer.vue'

defineProps<{
  content: string
  status?: string
}>()
</script>

<template>
  <div class="prose dark:prose-invert w-full max-w-none text-sm">
    <ClientOnly>
      <template #fallback>
        <div class="whitespace-pre-wrap">{{ content }}</div>
      </template>
      <MarkdownRenderer :content="content || (status === 'answering' ? ' ' : '')" />
    </ClientOnly>
    <ClientOnly>
      <span
        v-if="status === 'answering'"
        class="bg-primary-500 ml-1 inline-block h-4 w-1.5 animate-pulse align-middle"
      />
    </ClientOnly>
  </div>
</template>
