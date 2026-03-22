/**
 * SSE 原始事件结构
 */
export interface SSEEvent {
  event: string | null
  data: string
  id: string | null
  retry: number | null
}

/**
 * 基于 Fetch + ReadableStream 的自定义 SSE 解析器
 *
 * 职责：
 * 1. 逐块读取二进制流
 * 2. 自动解码为文本
 * 3. 按照 SSE 规范 (\n\n) 切分消息块
 * 4. 解析 data: 字段并转换为异步生成器
 *
 * @param response Fetch 响应对象
 */
export async function* parseSSEStream(response: Response): AsyncGenerator<SSEEvent> {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('Response body is not readable')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      // 1. 解码当前 chunk 并累加到缓冲区
      buffer += decoder.decode(value, { stream: true })

      // 2. 按照 SSE 标准分隔符 \n\n 处理完整消息块
      const parts = buffer.split('\n\n')

      // 最后一部分可能是不完整的消息，保留在缓冲区
      buffer = parts.pop() || ''

      for (const part of parts) {
        if (!part.trim()) continue
        yield parseSSEEvent(part)
      }
    }

    // 处理流结束后的残留缓冲区内容
    if (buffer.trim()) {
      yield parseSSEEvent(buffer)
    }
  } finally {
    // 释放锁，防止内存泄漏
    reader.releaseLock()
  }
}

/**
 * 解析单个 SSE 消息块内容
 * 格式示例：
 * event: thinking
 * data: {"delta": "..."}
 */
function parseSSEEvent(chunk: string): SSEEvent {
  const lines = chunk.split('\n')
  const event: SSEEvent = {
    event: null,
    data: '',
    id: null,
    retry: null
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const colonIndex = trimmed.indexOf(':')
    if (colonIndex === -1) continue

    const field = trimmed.slice(0, colonIndex).trim()
    const value = trimmed.slice(colonIndex + 1).trim()

    switch (field) {
      case 'event':
        event.event = value
        break
      case 'data':
        // 兼容多行数据字段拼合（虽然标准推荐单行 data）
        event.data = event.data ? `${event.data}\n${value}` : value
        break
      case 'id':
        event.id = value
        break
      case 'retry':
        event.retry = parseInt(value, 10) || null
        break
    }
  }

  return event
}
