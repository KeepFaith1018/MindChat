# Sky Chat Vue + Nuxt 重构开发计划评估表

> 目标：将 React + Next.js 重构为 Vue 3 + Nuxt 4，作为简历亮点项目

---

## 一、技术栈映射

| 原技术                  | 新技术                               | 说明           |
| ----------------------- | ------------------------------------ | -------------- |
| React 19                | Vue 3 (Composition API)              | 响应式系统重构 |
| Next.js 15 (App Router) | Nuxt 3                               | 服务端框架     |
| Zustand                 | Pinia                                | 状态管理       |
| shadcn/ui               | Element Plus / Naive UI / shadcn-vue | UI 组件库      |
| react-markdown          | markdown-it + 自定义渲染             | Markdown 渲染  |
| @tanstack/react-virtual | @tanstack/vue-virtual                | 虚拟滚动       |
| react-hook-form         | VeeValidate / FormKit                | 表单验证       |
| NextAuth.js             | NuxtAuth / 自定义 JWT                | 认证方案       |
| Prisma                  | Prisma (不变)                        | ORM            |
| PostgreSQL              | PostgreSQL (不变)                    | 数据库         |

---

## 二、功能模块评估

### 核心模块（必做，简历亮点）

| 模块                 | 难度     | 工作量 | 技术挑战                     | 简历价值   |
| -------------------- | -------- | ------ | ---------------------------- | ---------- |
| **SSE 流式聊天**     | ⭐⭐⭐⭐ | 3天    | 流式解析、状态同步、断点续传 | ⭐⭐⭐⭐⭐ |
| **消息状态机**       | ⭐⭐⭐⭐ | 2天    | 复杂状态转换、Vue 响应式适配 | ⭐⭐⭐⭐⭐ |
| **工具调用系统**     | ⭐⭐⭐⭐ | 3天    | 并行执行、进度反馈、错误处理 | ⭐⭐⭐⭐⭐ |
| **虚拟滚动消息列表** | ⭐⭐⭐   | 2天    | 大数据量渲染优化             | ⭐⭐⭐⭐   |
| **Markdown 渲染器**  | ⭐⭐⭐   | 2天    | 自定义块、代码高亮、流式渲染 | ⭐⭐⭐⭐   |
| **用户认证系统**     | ⭐⭐⭐   | 2天    | OAuth、JWT、账号关联         | ⭐⭐⭐     |

### 扩展模块（可选）

| 模块          | 难度   | 工作量 | 建议                          |
| ------------- | ------ | ------ | ----------------------------- |
| 语音输入/播报 | ⭐⭐⭐ | 2天    | 可选，展示 Web Audio API 能力 |
| 文件上传解析  | ⭐⭐   | 1天    | 可选，基础功能                |
| 会话分享      | ⭐⭐   | 1天    | 可选                          |
| 对话导出      | ⭐     | 0.5天  | 简单，可做                    |
| 图片生成      | ⭐⭐⭐ | 1.5天  | 可选，依赖工具调用系统        |

### 删除模块

| 模块                   | 原因                 |
| ---------------------- | -------------------- |
| 监控系统 (lib/monitor) | 按要求删除           |
| 调试面板 (DebugPanel)  | 开发工具，非核心功能 |
| rrweb 回放             | 监控相关             |
| 网络探测               | 监控相关             |

---

## 三、详细开发计划

### Phase 1: 项目初始化（1天）

```
Day 1:
├── 创建 Nuxt 3 项目
├── 配置 TypeScript、ESLint、Prettier
├── 集成 Tailwind CSS
├── 配置 Prisma + PostgreSQL
├── 设计目录结构
│   ├── composables/     # 组合式函数（替代 hooks）
│   ├── components/      # 组件
│   ├── pages/           # 页面
│   ├── server/          # 服务端
│   │   ├── api/         # API 路由
│   │   ├── services/    # 业务逻辑
│   │   └── repositories/
│   └── stores/          # Pinia Store
└── 初始化数据库 Schema
```

### Phase 2: 认证系统（2天）

````
Day 2-3:
├── 后端
│   ├── 用户注册/登录 API
│   ├── JWT 生成/验证
│   ├── OAuth2.0（GitHub/Google）
│   └── 账号关联逻辑
├── 前端
│   ├── 登录/注册页面
│   ├── useAuth composable
│   ├── 路由守卫中间件
│   └── Token 自动刷新
└── Nuxt Server API 示例:
    ```typescript
    // server/api/auth/login.post.ts
    export default defineEventHandler(async (event) => {
      const { email, password } = await readBody(event)
      // ...验证逻辑
      setCookie(event, 'token', jwt, { httpOnly: true })
      return { user }
    })
    ```
````

### Phase 3: 聊天核心（5天）

````
Day 4-8: ⭐ 核心亮点

Day 4: 会话管理
├── 会话列表 API
├── 会话 CRUD
├── useConversationStore
└── 会话搜索

Day 5-6: SSE 流式聊天 ⭐⭐⭐⭐⭐
├── 后端 SSE 实现
│   ```typescript
│   // server/api/chat.post.ts
│   export default defineEventHandler(async (event) => {
│     setResponseHeaders(event, {
│       'Content-Type': 'text/event-stream',
│       'Cache-Control': 'no-cache',
│     })
│
│     const stream = new ReadableStream({
│       async start(controller) {
│         const encoder = new TextEncoder()
│         // 流式写入
│         controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
│       }
│     })
│     return sendStream(event, stream)
│   })
│   ```
├── 前端 SSE 解析
│   ```typescript
│   // composables/useSSE.ts
│   export function useSSE(url: string) {
│     const messages = ref<Message[]>([])
│     const isStreaming = ref(false)
│
│     const connect = () => {
│       const eventSource = new EventSource(url)
│       eventSource.onmessage = (event) => {
│         const data = JSON.parse(event.data)
│         // 处理消息
│       }
│     }
│   }
│   ```
└── 断点续传、错误重试

Day 7: 消息状态机 ⭐⭐⭐⭐⭐
├── 状态定义
│   ```typescript
│   // composables/useMessageStateMachine.ts
│   type MessagePhase = 'idle' | 'thinking' | 'tool_calling' | 'answering' | 'error'
│
│   const VALID_TRANSITIONS: Record<MessagePhase, MessagePhase[]> = {
│     idle: ['thinking', 'answering', 'error'],
│     thinking: ['tool_calling', 'answering', 'error'],
│     tool_calling: ['answering', 'tool_calling', 'error'],
│     answering: ['idle', 'error'],
│     error: ['idle'],
│   }
│
│   export function useMessageStateMachine() {
│     const currentPhase = ref<MessagePhase>('idle')
│
│     const transition = (event: PhaseEvent) => {
│       const next = getNextPhase(currentPhase.value, event)
│       if (next) currentPhase.value = next
│     }
│
│     return { currentPhase, transition }
│   }
│   ```
└── UI 状态联动

Day 8: 消息持久化
├── 消息保存 API
├── 消息加载
├── 消息编辑/删除
└── 消息缓存策略
````

### Phase 4: 工具调用系统（3天）

````
Day 9-11: ⭐⭐⭐⭐⭐ 核心亮点

Day 9: 工具注册表
├── 工具接口定义
│   ```typescript
│   // server/services/tools/types.ts
│   interface Tool {
│     name: string
│     description: string
│     parameters: JSONSchema
│     execute: (args: Record<string, unknown>) => Promise<string>
│   }
│   ```
├── 工具注册中心
└── OpenAI Function Calling 格式转换

Day 10: 网页搜索工具
├── 搜索 API 集成
├── 结果解析
└── SSE 进度推送

Day 11: 工具并行执行 ⭐⭐⭐⭐⭐
├── 并行调度器
│   ```typescript
│   // server/services/tools/executor.ts
│   export async function executeToolsParallel(
│   toolCalls: ToolCall[],
│   onProgress: (id: string, progress: number) => void
│   ) {
│     const promises = toolCalls.map(async (tool) => {
│       const result = await toolRegistry.execute(tool.name, tool.args)
│       onProgress(tool.id, 100)
│       return result
│     })
│     return Promise.all(promises)
│   }
│   ```
├── 进度回调机制
└── 前端进度展示组件
````

### Phase 5: UI 渲染优化（4天）

````
Day 12-15:

Day 12: 虚拟滚动消息列表 ⭐⭐⭐⭐
├── @tanstack/vue-virtual 集成
│   ```vue
│   <script setup lang="ts">
│   import { useVirtualizer } from '@tanstack/vue-virtual'
│
│   const virtualizer = useVirtualizer({
│     count: messages.value.length,
│     getScrollElement: () => scrollRef.value,
│     estimateSize: (index) => estimateMessageSize(messages.value[index]),
│     overscan: 3,
│   })
│   </script>
│   ```
└── 滚动到底部逻辑

Day 13-14: Markdown 渲染器 ⭐⭐⭐⭐
├── markdown-it 配置
├── 代码高亮 (highlight.js)
├── 自定义块解析
│   ```typescript
│   // 自定义 fence 规则
│   md.renderer.rules.fence = (tokens, idx) => {
│     const token = tokens[idx]
│     if (token.info === 'image') {
│       return `<ImageBlock data="${token.content}" />`
│     }
│     // ...
│   }
│   ```
├── 流式渲染优化
│   ```typescript
│   // 流式时延迟渲染未闭合代码块
│   function preprocessStreamingContent(content: string, isStreaming: boolean) {
│     if (!isStreaming) return content
│     // 检测未闭合的 ```，补全或隐藏
│   }
│   ```
└── 光标动画

Day 15: 消息组件
├── 用户消息
├── AI 消息
├── Thinking 面板
├── 工具调用进度
└── 消息操作按钮
````

### Phase 6: 完善与优化（2天）

```
Day 16-17:
├── 输入组件（文件上传、语音按钮）
├── 响应式布局
├── 暗色模式
├── 错误处理
├── Loading 状态
└── 性能优化
```

---

## 四、工作量汇总

| 阶段              | 工作量   | 核心产出                |
| ----------------- | -------- | ----------------------- |
| Phase 1: 初始化   | 1天      | 项目骨架、数据库        |
| Phase 2: 认证     | 2天      | 登录/注册/OAuth         |
| Phase 3: 聊天核心 | 5天      | SSE流、状态机、消息管理 |
| Phase 4: 工具调用 | 3天      | 工具注册、并行执行      |
| Phase 5: UI渲染   | 4天      | 虚拟滚动、Markdown      |
| Phase 6: 完善     | 2天      | 输入、布局、优化        |
| **总计**          | **17天** | -                       |

> 按 8 小时/天计算，约 **3-4 周**（含周末）

---

## 五、简历亮点提炼

### 亮点 1: SSE 流式聊天系统 ⭐⭐⭐⭐⭐

**面试话术**：

> 实现了基于 SSE 的 AI 流式聊天系统，支持 Thinking 推理过程实时展示、工具调用进度反馈。通过流式缓冲区优化，将渲染频率从 50ms 降低到 150ms，减少 60% 的无效渲染。

**技术要点**：

- SSE 双向流处理
- 自定义 SSE 解析器
- 流式缓冲区批量更新
- 断点续传与错误恢复

**代码示例**（可放在简历）：

```typescript
// SSE 流式处理器
async function handleStream(reader: ReadableStreamReader, onChunk: (data: SSEData) => void) {
  const decoder = new TextDecoder()
  const buffer = new StreamBuffer({ flushInterval: 150 })

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const lines = decoder.decode(value).split('\n')
    for (const line of lines) {
      const data = parseSSELine(line)
      if (data) onChunk(data)
    }
  }
}
```

### 亮点 2: 消息状态机 ⭐⭐⭐⭐⭐

**面试话术**：

> 设计了消息生命周期状态机，精确控制 idle → thinking → tool_calling → answering 的状态转换。通过 Vue 3 的响应式系统，实现了状态与 UI 的自动联动，避免了复杂的命令式状态管理。

**技术要点**：

- 状态机设计模式
- Vue 3 Composition API
- 响应式状态管理
- 类型安全的状态转换

**代码示例**：

```typescript
const VALID_TRANSITIONS: Record<MessagePhase, MessagePhase[]> = {
  idle: ['thinking', 'answering', 'error'],
  thinking: ['tool_calling', 'answering', 'error'],
  tool_calling: ['answering', 'tool_calling', 'error'],
  answering: ['idle', 'error'],
  error: ['idle']
}

export function useMessageState(messageId: string) {
  const phase = ref<MessagePhase>('idle')
  const activeTools = ref(new Map<string, ActiveTool>())

  const transition = (event: PhaseEvent) => {
    const next = getNextPhase(phase.value, event)
    if (next) {
      phase.value = next
      // 自动触发 UI 更新
    }
  }

  return { phase, activeTools, transition }
}
```

### 亮点 3: 工具并行执行系统 ⭐⭐⭐⭐⭐

**面试话术**：

> 实现了可插拔的工具系统，支持 AI 模型调用外部工具（网页搜索、图片生成）。创新点在于"流式并行执行"——在 AI 返回 tool_call 时立即启动执行，多个工具并行运行，显著减少用户等待时间。

**技术要点**：

- 工具注册表模式
- OpenAI Function Calling
- Promise.all 并行调度
- SSE 进度推送

**架构图**：

```
AI Response Stream
       │
       ▼ parse tool_calls
┌──────────────────┐
│  ToolScheduler   │
└──────────────────┘
       │
       ├──▶ Tool 1 (async) ──▶ Progress SSE
       ├──▶ Tool 2 (async) ──▶ Progress SSE
       └──▶ Tool 3 (async) ──▶ Progress SSE
              │
              ▼ Promise.all
       ┌──────────────────┐
       │  Tool Results    │
       └──────────────────┘
              │
              ▼ Continue Stream
```

### 亮点 4: 虚拟滚动 + 流式渲染 ⭐⭐⭐⭐

**面试话术**：

> 针对长对话场景，使用虚拟滚动优化渲染性能，支持万条消息流畅滚动。结合流式渲染时自动滚动到底部的智能判断，实现了用户体验与性能的平衡。

**技术要点**：

- @tanstack/vue-virtual
- 动态高度估算
- 自动滚动逻辑
- 用户滚动状态检测

### 亮点 5: Markdown 流式渲染器 ⭐⭐⭐⭐

**面试话术**：

> 实现了支持流式传输的 Markdown 渲染器，智能处理未闭合的代码块，延迟渲染不完整的 JSON 数据。支持自定义内容块（图片、图表、天气卡片），扩展性强。

**技术要点**：

- markdown-it 自定义规则
- 代码高亮
- 流式内容预处理
- 自定义块组件

---

## 六、技术难点与解决方案

### 难点 1: Vue 响应式 + Map/Set

**问题**：Zustand 使用 Map 存储消息状态，Vue 3 对 Map 的响应式追踪需要特殊处理

**解决方案**：

```typescript
// 方案 1: 使用 reactive + Map
const state = reactive({
  messageStates: new Map<string, MessageState>()
})

// 更新时触发响应
state.messageStates.set(id, newState)

// 方案 2: 使用 ref + 每次替换
const messageStates = ref(new Map<string, MessageState>())

// 更新时创建新 Map
messageStates.value = new Map(messageStates.value).set(id, newState)

// 方案 3: 使用 VueUse 的 reactiveMap
import { reactiveMap } from '@vueuse/core'
const messageStates = reactiveMap<string, MessageState>()
```

### 难点 2: Nuxt 3 SSE 响应

**问题**：Nuxt 3 的 `defineEventHandler` 需要特殊处理 SSE

**解决方案**：

```typescript
// server/api/chat.post.ts
export default defineEventHandler(async (event) => {
  // 设置 SSE 响应头
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  })

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      // 发送事件
      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      // AI 流式响应
      for await (const chunk of aiStream) {
        sendEvent('message', chunk)
      }

      controller.close()
    }
  })

  return sendStream(event, stream)
})
```

### 难点 3: 认证中间件

**问题**：Nuxt 3 的中间件与 Next.js 不同

**解决方案**：

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie('token')

  if (!token.value && to.path.startsWith('/chat')) {
    return navigateTo('/login')
  }

  if (token.value && to.path === '/') {
    return navigateTo('/chat')
  }
})

// server/middleware/auth.ts
export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'token')

  if (!token) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  // 验证 JWT
  const user = await verifyJWT(token)
  event.context.user = user
})
```

---

## 七、可选功能推荐

### 推荐实现（性价比高）

| 功能     | 工作量 | 简历价值 | 原因                       |
| -------- | ------ | -------- | -------------------------- |
| 语音输入 | 1天    | ⭐⭐⭐   | 展示 Web Audio API 能力    |
| 对话导出 | 0.5天  | ⭐⭐     | 简单实用，体现用户体验关注 |
| 图片生成 | 1天    | ⭐⭐⭐   | 依赖工具系统，扩展性好     |

### 可省略

| 功能           | 原因               |
| -------------- | ------------------ |
| 会话分享       | 功能简单，亮点不足 |
| 复杂的会话搜索 | 基础搜索即可       |
| 网络状态检测   | 非核心功能         |

---

## 八、项目目录结构（重构后）

```
sky-chat-vue/
├── app.vue                      # 根组件
├── pages/
│   ├── index.vue                # 首页
│   ├── chat/
│   │   ├── index.vue            # 新对话
│   │   └── [id].vue             # 会话详情
│   ├── auth/
│   │   ├── login.vue
│   │   └── register.vue
│   └── share/
│       └── [token].vue
│
├── components/
│   ├── chat/
│   │   ├── ChatInput.vue
│   │   ├── ChatMessage.vue
│   │   ├── MessageList.vue
│   │   ├── MessageContent.vue
│   │   ├── ThinkingPanel.vue
│   │   ├── ToolProgress.vue
│   │   └── ModelSelector.vue
│   ├── conversation/
│   │   ├── ConversationList.vue
│   │   └── ConversationItem.vue
│   ├── auth/
│   │   ├── LoginForm.vue
│   │   └── OAuthButtons.vue
│   └── ui/                      # Element Plus / 自定义组件
│
├── composables/
│   ├── useChat.ts               # 聊天核心逻辑
│   ├── useSSE.ts                # SSE 处理
│   ├── useMessageState.ts       # 消息状态机
│   ├── useAuth.ts               # 认证
│   ├── useConversation.ts       # 会话管理
│   └── useVirtualScroll.ts      # 虚拟滚动
│
├── stores/
│   ├── chat.ts                  # Pinia Store
│   ├── conversation.ts
│   └── user.ts
│
├── server/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.post.ts
│   │   │   ├── register.post.ts
│   │   │   └── logout.post.ts
│   │   ├── chat.post.ts         # SSE 流式聊天
│   │   ├── conversations/
│   │   │   ├── index.get.ts
│   │   │   └── [id]/
│   │   │       └── messages.get.ts
│   │   └── messages/
│   │       └── delete.post.ts
│   ├── services/
│   │   ├── ai/
│   │   │   └── siliconflow.ts
│   │   ├── chat/
│   │   │   ├── chat.service.ts
│   │   │   └── stream.handler.ts
│   │   └── tools/
│   │       ├── registry.ts
│   │       ├── web-search.ts
│   │       └── image-generation.ts
│   ├── repositories/
│   │   ├── conversation.ts
│   │   └── message.ts
│   └── middleware/
│       └── auth.ts
│
├── utils/
│   ├── sse-parser.ts
│   ├── stream-buffer.ts
│   └── markdown.ts
│
├── types/
│   ├── chat.ts
│   └── message.ts
│
├── prisma/
│   └── schema.prisma
│
└── nuxt.config.ts
```

---

## 九、面试问题预案

### Q1: 为什么选择 Vue + Nuxt 重构？

> 答：Vue 3 的 Composition API 提供了更灵活的逻辑复用方式，Nuxt 3 的文件路由和自动导入大大提升了开发效率。选择重构是为了深入理解框架差异，展示全栈能力。

### Q2: SSE 流式聊天有什么难点？

> 答：1) 流式解析需要处理不完整的数据块；2) 状态同步需要考虑竞态条件；3) 错误恢复和断点续传；4) 前端渲染性能优化。我通过 StreamBuffer 批量刷新、状态机精确控制状态转换来解决。

### Q3: 工具并行执行怎么实现的？

> 答：在 AI 流式返回时，一旦解析出完整的 tool_call 就立即启动执行，不等待整个流结束。使用 Promise.all 收集结果，通过 SSE 推送进度。这样工具执行和 AI 思考可以并行，用户感知的等待时间更短。

### Q4: Vue 响应式和 React 有什么区别？遇到什么问题？

> 答：React 是手动依赖追踪（useState/useEffect），Vue 是自动依赖追踪。遇到 Map/Set 需要用 reactive 包装或 VueUse 的 reactiveMap。另外，Vue 的 watch 可以精确监听嵌套属性，比 useEffect 更细粒度。

### Q5: 为什么设计消息状态机？

> 答：消息有复杂的生命周期：等待 → 思考 → 工具调用 → 回答 → 完成/错误。每个阶段对应不同的 UI 展示。状态机让状态转换可控、可预测，避免状态不一致的问题。

---

## 十、总结

### 最小可行产品 (MVP)

**核心功能**：

1. ✅ 用户认证（邮箱密码 + OAuth）
2. ✅ SSE 流式聊天
3. ✅ 消息状态机
4. ✅ 工具调用（网页搜索）
5. ✅ 虚拟滚动消息列表
6. ✅ Markdown 渲染

**工作量**：约 17 天

### 简历亮点排序

| 排名 | 亮点                | 独特性     | 技术深度   |
| ---- | ------------------- | ---------- | ---------- |
| 1    | 工具并行执行系统    | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 2    | SSE 流式聊天        | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ |
| 3    | 消息状态机          | ⭐⭐⭐⭐   | ⭐⭐⭐⭐   |
| 4    | 虚拟滚动 + 流式渲染 | ⭐⭐⭐     | ⭐⭐⭐⭐   |
| 5    | Markdown 流式渲染   | ⭐⭐⭐     | ⭐⭐⭐     |

### 技术成长

- ✅ 深入理解 SSE 流式通信
- ✅ 掌握状态机设计模式
- ✅ Vue 3 Composition API 最佳实践
- ✅ Nuxt 3 全栈开发
- ✅ 性能优化（虚拟滚动、批量更新）
- ✅ OpenAI Function Calling 集成
