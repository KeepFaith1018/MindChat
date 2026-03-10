# MindChat (Nuxt 4)

基于 Nuxt 4 的前端项目。

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
