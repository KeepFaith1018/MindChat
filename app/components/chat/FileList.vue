<script setup lang="ts">
import type { UploadResponseData } from '~/api/upload'

defineProps<{
  files: UploadResponseData[]
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

function getIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'pdf':
      return 'i-lucide-file-text'
    case 'doc':
    case 'docx':
      return 'i-lucide-file-type'
    case 'txt':
    case 'md':
      return 'i-lucide-file-code'
    default:
      return 'i-lucide-file'
  }
}
</script>

<template>
  <div v-if="files.length > 0" class="flex flex-wrap gap-2 px-2 pb-2">
    <div
      v-for="file in files"
      :key="file.id"
      class="group hover:border-primary-200 dark:hover:border-primary-800 relative flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 shadow-sm transition-all dark:border-gray-800 dark:bg-gray-900"
    >
      <div class="flex h-6 w-6 items-center justify-center rounded bg-gray-100 dark:bg-gray-800">
        <UIcon :name="getIcon(file.filename)" class="h-4 w-4 text-gray-500" />
      </div>

      <div class="flex flex-col">
        <span class="max-w-[120px] truncate text-xs font-medium text-gray-700 dark:text-gray-200">
          {{ file.filename }}
        </span>
        <span class="text-[10px] text-gray-400"> {{ (file.size / 1024).toFixed(1) }} KB </span>
      </div>

      <UButton
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        size="xs"
        class="ml-1 opacity-0 transition-opacity group-hover:opacity-100"
        @click="emit('remove', file.id)"
      />
    </div>
  </div>
</template>
