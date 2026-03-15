<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import { createHighlighter } from 'shiki'

const props = defineProps<{
  content: string
}>()

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  typographer: true
})

// Shiki 代码高亮
let highlighter: any = null
const highlightedContent = ref('')

onMounted(async () => {
  try {
    highlighter = await createHighlighter({
      themes: ['github-dark', 'github-light'],
      langs: ['javascript', 'typescript', 'python', 'json', 'bash', 'html', 'css', 'vue']
    })

    // 重写 highlight 逻辑
    md.options.highlight = (code, lang) => {
      const theme = document.documentElement.classList.contains('dark')
        ? 'github-dark'
        : 'github-light'
      try {
        if (lang && highlighter.getLoadedLanguages().includes(lang)) {
          return highlighter.codeToHtml(code, { lang, theme })
        }
        return highlighter.codeToHtml(code, { lang: 'text', theme })
      } catch (e) {
        console.error('Shiki highlighting failed:', e)
        return `<pre><code>${md.utils.escapeHtml(code)}</code></pre>`
      }
    }

    renderMarkdown()
  } catch (e) {
    console.error('Shiki initialization failed:', e)
    // Fallback simple render
    highlightedContent.value = md.render(props.content)
  }
})

// 监听内容变化重新渲染
watch(
  () => props.content,
  () => {
    renderMarkdown()
  }
)

const renderMarkdown = () => {
  if (!highlighter) {
    highlightedContent.value = md.render(props.content)
    return
  }
  highlightedContent.value = md.render(props.content)
}
</script>

<template>
  <div class="prose dark:prose-invert max-w-none break-words" v-html="highlightedContent" />
</template>

<style>
/* 可以在这里添加额外的 Markdown 样式 */
.prose pre {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  padding: 1em;
  border-radius: 0.5rem;
  overflow-x: auto;
}
</style>
