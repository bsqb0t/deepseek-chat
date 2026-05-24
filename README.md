# DeepSeek Chat Web Clone

一个克隆 DeepSeek 官方聊天界面的纯静态单页应用，支持 DeepSeek API 的大部分功能。

https://bsqb0t.github.io/deepseek-chat/

## 功能特性

### 核心功能
- **多会话管理** - 创建、切换、删除、重命名对话
- **流式 SSE 响应** - 逐 token 实时显示回复
- **思考模式** - 支持 DeepSeek 专有的 `thinking` 和 `reasoning_effort` 参数
- **代码语法高亮** - 使用 highlight.js 实现代码块高亮
- **文件上传** - 支持图片（base64）和文本文件上传  ***【暂不支持图片】***
- **拖拽上传** - 支持拖拽文件到聊天区域
- **粘贴图片** - 支持直接粘贴剪贴板图片  ***【暂不支持图片】***
- **消息编辑** - 编辑用户消息重新发送
- **消息重新生成** - 重新生成助手回复
- **响应式布局** - 适配移动端，支持侧边栏折叠

### API 兼容性
- **默认端点**: `https://api.deepseek.com`
- **OpenAI 兼容**: 支持任何 OpenAI 兼容的 `/v1` 格式端点
- **DeepSeek 专有参数**: 自动检测 DeepSeek API 并启用 `thinking` 和 `reasoning_effort`

## 快速开始

### 1. 获取 API 密钥
访问 [DeepSeek 开放平台](https://platform.deepseek.com/) 获取 API 密钥。

### 2. 运行应用
```bash
# 进入项目目录
cd deepseek-chat

# 启动本地服务器
python3 -m http.server 8080

# 或者使用 Node.js
npx serve .

# 或者使用 PHP
php -S localhost:8080

或根据下文在线部署
```

### 3. 配置 API

##本地部署
1. 打开浏览器访问 `http://localhost:8080`
2. 点击左下角"设置"按钮
3. 填入 API 密钥
4. 可选：修改 API Base URL（支持 OpenAI 兼容端点）

## 项目结构

```
deepseek-chat/
├── deepseek-api-docs_2026_5_24   # 官方文档(2026/5/24)
├── index.html                   # 页面结构
├── style.css                    # 样式（DeepSeek 风格深色主题）
├── app.js                       # 全部逻辑（IIFE 封装）
├── CLAUDE.md                    # Claude Code 项目文档
└── README.md                    # 本文件
```

## 技术栈

- **前端**: 原生 HTML/CSS/JS，无框架依赖
- **CDN 依赖**:
  - [marked v12.0.1](https://github.com/markedjs/marked) - Markdown 解析
  - [highlight.js 11.9.0](https://highlightjs.org/) - 代码语法高亮
- **存储**: localStorage（对话历史 + 设置）

## 配置说明

### 设置项

| 设置 | 说明 | 默认值 |
|------|------|--------|
| API 密钥 | DeepSeek API 密钥 | 空 |
| API Base URL | API 端点地址 | `https://api.deepseek.com` |
| 系统提示词 | 全局系统提示 | 空 |
| 模型选择 | 默认使用的模型 | `deepseek-v4-flash` |
| 思考模式 | 是否启用深度思考 | 启用 |
| 思考强度 | 推理强度 | `high` |

### 支持的模型

- `deepseek-v4-flash` - 快速响应模型
- `deepseek-v4-pro` - 专业推理模型

## 开发指南

### 本地开发
```bash
# 启动开发服务器
python3 -m http.server 8080

# 语法检查
node -c app.js

# 浏览器控制台查看调试日志
```

### 关键实现细节

#### marked v12 渲染器
```javascript
// v12 的 renderer.code 回调接收 token 对象
renderer.code = function(token) {
  const code = token.text;
  const lang = token.lang;
  // ...
};
```

#### 流式性能优化
```javascript
// 使用 100ms throttle 避免每个 token 全量 re-parse
const throttledUpdate = throttle(updateStreamingMessage, 100);
```

#### 竞态保护
```javascript
// 捕获 targetConvId，防止用户切换会话导致消息错乱
const targetConvId = currentConvId;
// finally 块用该 ID 保存消息
```

#### thinking 参数结构
```javascript
// reasoning_effort 在 thinking 内部
body.thinking = { 
  type: 'enabled', 
  reasoning_effort: 'high' 
};
```

#### 文件上传
```javascript
// 图片：FileReader.readAsDataURL → base64 → image_url 格式
// 文本：FileReader.readAsText(file, 'UTF-8') → 拼入消息正文
// 必须 await handleFiles() 后再清空 fileInput.value
```

## API 文档参考

详细的 API 文档请参考 `deepseek-api-docs` 目录：

- [对话补全](./deepseek-api-docs/api/create-chat-completion.md) - 核心接口
- [思考模式](./deepseek-api-docs/guides/thinking_mode.md) - 思考模式使用指南
- [工具调用](./deepseek-api-docs/guides/tool_calls.md) - Function Calling
- [多轮对话](./deepseek-api-docs/guides/multi_round_chat.md) - 上下文管理

## 部署

本项目为纯静态应用，可直接部署到任何静态托管服务。

### GitHub Pages
1. 将代码推送到 GitHub 仓库
2. 进入仓库 Settings → Pages
3. 选择分支（通常是 `main`）和目录（`/root`）
4. 保存后即可通过 `https://username.github.io/repo-name` 访问

### Cloudflare Pages
1. 将代码推送到 GitHub/GitLab 仓库
2. 登录 Cloudflare Dashboard → Pages
3. 连接仓库并选择分支
4. 构建设置保持默认（无需构建命令）
5. 部署后获得 `https://project.pages.dev` 域名

## 已知限制

- **无后端代理** - API Key 暴露在前端（仅适合个人使用）
- **localStorage 限制** - 约 5-10MB 容量，大量对话或大文件上传可能触发
- **图片上传** - 依赖模型是否支持 vision（DeepSeek API 文档未明确说明）
- **浏览器兼容** - 需要现代浏览器支持（ES6+）


## 致谢

- [DeepSeek](https://www.deepseek.com/) - 提供强大的 AI 模型
- [marked](https://github.com/markedjs/marked) - Markdown 解析库
- [highlight.js](https://highlightjs.org/) - 代码语法高亮库
