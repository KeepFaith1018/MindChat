# MindChat (Nuxt 4)

基于 Nuxt 4 的 AI 智能聊天前端项目，采用 Soft UI 设计风格。

## 🚀 快速开始

### 1. 安装依赖

本项目强制要求使用 **pnpm** 作为包管理器。

```bash
pnpm install
```

### 2. 开发环境

启动本地开发服务器：

```bash
pnpm dev
```

### 3. 环境配置

复制环境模板并配置：

```bash
cp .env.example .env
```

配置 `.env` 中的 `DATABASE_URL` 为您的 PostgreSQL 连接字符串。

### 4. 数据库同步与初始化

```bash
# 生成 Prisma 客户端
pnpm run db:generate

# 执行数据库迁移 (首次运行)
npx prisma migrate dev --name init

# 填充种子数据
pnpm run db:seed
```

---

## 🏗 开发进度 (Development Progress)

### 第一阶段：基础设施与认证

- [x] 数据库 Schema 设计 (Prisma + PostgreSQL)
- [x] 数据库时区修复 (Timestamptz 适配)
- [x] 用户认证基础 (Token 持久化与 Cookie 管理)
- [x] **后端认证 API**: 注册、登录、登出、用户信息 (双 Token 机制)
- [x] **OAuth 集成**: GitHub、Google 第三方登录与账号关联
- [x] 前端 Auth Composables 基础实现

### 第二阶段：UI/UX 与 移动端适配

- [x] **移动端响应式布局**: 修复对话页移动端侧边栏显示与交互问题
- [x] **UI 交互增强**: 侧边栏设置项高亮、登录页全宽输入框、Soft UI 圆角优化
- [x] **性能优化**: 缩短首屏 Loading 延时，加速页面跳转逻辑

### 第三阶段：核心聊天引擎 (进行中)

- [ ] SSE 服务端代理 (API Key 保护)
- [ ] 前端流式解析器 (Thinking/Tool/Content)
- [ ] 消息状态机管理

---

## 📚 项目文档 (Documentation)

详细的设计方案与开发指南请参考 `doc/` 目录：

1. [01-项目需求与实现计划](doc/01-项目需求与实现计划.md)
2. [02-数据库架构设计](doc/02-数据库架构设计.md)
3. [03-前端架构与UI设计](doc/03-前端架构与UI设计.md)
4. [04-认证系统实施方案](doc/04-认证系统实施方案.md)
5. [05-Nuxt4技术架构指南](doc/05-Nuxt4技术架构指南.md)
6. [06-前端工程规范化指南](doc/06-前端工程规范化指南.md)
7. [07-开发进度与路线图](doc/07-开发进度与路线图.md)
8. [08-认证界面专项设计](doc/08-认证界面专项设计.md)
9. [09-后端认证模块接口设计与实现方案](doc/09-后端认证模块接口设计与实现方案.md)

---

## 🛠 工程规范

### 1. 代码校验与格式化

在提交代码前，建议运行以下命令进行全量检查：

```bash
# 代码风格检查
pnpm lint

# 自动修复 Lint 问题
pnpm lint:fix

# 类型检查
pnpm typecheck

# 检查代码格式
pnpm format

# 强制执行格式化
pnpm format:write
```

### 2. Git 提交规范

本项目采用 [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) 规范。提交时请遵循以下格式：

```bash
git commit -m "<type>(scope): <subject>"
```

**常见 type 说明：**

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式（不影响运行逻辑）
- `refactor`: 重构
- `perf`: 性能优化
- `chore`: 构建过程或辅助工具变动

---

## 📦 生产环境

### 构建与预览

```bash
# 打包
pnpm build

# 预览
pnpm preview
```

更多信息请参考 [Nuxt 文档](https://nuxt.com/docs/getting-started/introduction)。
