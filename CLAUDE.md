# DeepSeek Chat Web Clone

纯静态单页应用，克隆 DeepSeek 官方聊天界面。无构建工具，无框架依赖。

## 文件结构

```
deepseek-chat/
├── index.html    — 页面结构
├── style.css     — 样式（DeepSeek 风格深色主题）
├── app.js        — 全部逻辑（IIFE 封装）
└── CLAUDE.md     — 本文件
```

## 技术栈

- 前端原生 HTML/CSS/JS，无框架
- CDN 依赖：marked v12.0.1（Markdown）、highlight.js 11.9.0（代码高亮）
- 存储：localStorage（对话历史 + 设置）

## 核心功能

- 多会话管理（创建、切换、删除、重命名）
- 流式 SSE 响应（逐 token 显示）
- 思考模式（DeepSeek 专有 `thinking` + `reasoning_effort` 参数）
- 代码语法高亮 + 一键复制
- 文件上传（图片 base64、文本文件内容拼入消息）
- 拖拽上传 + 粘贴图片
- 编辑用户消息重新发送 / 助手消息重新生成
- 自定义 API 端点（支持 OpenAI 兼容 `/v1` 格式）
- 响应式布局（移动端侧边栏折叠）

## API 兼容性

- 默认端点：`https://api.deepseek.com`
- `resolveApiUrl()` 自动拼接 `/chat/completions`
- DeepSeek 专有参数（`thinking`、`reasoning_effort`）仅在 URL 包含 `deepseek.com` 时发送
- 其他 OpenAI 兼容端点只发标准参数（`model`、`messages`、`stream`、`temperature`）

## 关键实现细节

### marked v12 渲染器
`renderer.code` 回调接收 token 对象（非旧版三参数），用 `token.text` 和 `token.lang`。

### 流式性能
`updateStreamingMessage` 使用 100ms throttle，避免每个 token 全量 re-parse。

### 竞态保护
`sendMessage` 中捕获 `targetConvId`，finally 块用该 ID 保存消息，防止用户切换会话导致消息错乱。

### thinking 参数结构
```js
body.thinking = { type: 'enabled', reasoning_effort: 'high' }  // reasoning_effort 在 thinking 内部
```

### 文件上传
- 图片：`FileReader.readAsDataURL` → base64 data URL → `image_url` 格式
- 文本：`FileReader.readAsText(file, 'UTF-8')` → 拼入消息正文
- 必须 `await handleFiles()` 后再清空 `fileInput.value`，否则 File 引用失效

## 已知限制

- 无后端代理，API Key 暴露在前端（仅适合个人使用）
- localStorage 有容量限制（约 5-10MB），大量对话或大文件上传可能触发
- 图片上传依赖模型是否支持 vision（DeepSeek API 文档未明确说明）

## 开发提示

- 修改后直接刷新浏览器测试，无需构建
- 本地测试：`python3 -m http.server 8080`
- 语法检查：`node -c app.js`
- 浏览器控制台有文件上传调试日志

## 部署

纯静态应用，可直接部署到 GitHub Pages 或 Cloudflare Pages。

- **GitHub Pages**: 推送到仓库后在 Settings → Pages 启用
- **Cloudflare Pages**: 连接仓库后自动部署，无需构建命令

## API 文档参考

详细的 API 文档请参考 `deepseek-api-docs` 目录：

- [对话补全](../deepseek-api-docs/api/create-chat-completion.md) - 核心接口
- [思考模式](../deepseek-api-docs/guides/thinking_mode.md) - 思考模式使用指南
- [工具调用](../deepseek-api-docs/guides/tool_calls.md) - Function Calling
- [多轮对话](../deepseek-api-docs/guides/multi_round_chat.md) - 上下文管理
