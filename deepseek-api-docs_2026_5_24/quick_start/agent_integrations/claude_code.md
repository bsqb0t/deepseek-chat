<!-- Source: https://api-docs.deepseek.com/zh-cn/quick_start/agent_integrations/claude_code -->

- [](/zh-cn/)- 快速开始- 接入 Agent 工具- Claude Code
本页总览


# 接入 Claude Code

Claude Code 是一个运行在终端内的 AI 编程助手。


## 从现有安装中迁移到 DeepSeek[​](#从现有安装中迁移到-deepseek)

如果你已经安装了 Claude Code，只需修改以下环境变量，其中 API Key 在 [DeepSeek Platform](https://platform.deepseek.com/api_keys) 获取。


Linux / Mac 用户，直接在终端中执行：


```
export ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropicexport ANTHROPIC_AUTH_TOKEN=export ANTHROPIC_MODEL=deepseek-v4-pro[1m]export ANTHROPIC_DEFAULT_OPUS_MODEL=deepseek-v4-pro[1m]export ANTHROPIC_DEFAULT_SONNET_MODEL=deepseek-v4-pro[1m]export ANTHROPIC_DEFAULT_HAIKU_MODEL=deepseek-v4-flashexport CLAUDE_CODE_SUBAGENT_MODEL=deepseek-v4-flashexport CLAUDE_CODE_EFFORT_LEVEL=max
```


Windows 用户，在 Powershell 中执行：


```
$env:ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic"$env:ANTHROPIC_AUTH_TOKEN=""$env:ANTHROPIC_MODEL="deepseek-v4-pro[1m]"$env:ANTHROPIC_DEFAULT_OPUS_MODEL="deepseek-v4-pro[1m]"$env:ANTHROPIC_DEFAULT_SONNET_MODEL="deepseek-v4-pro[1m]"$env:ANTHROPIC_DEFAULT_HAIKU_MODEL="deepseek-v4-flash"$env:CLAUDE_CODE_SUBAGENT_MODEL="deepseek-v4-flash"$env:CLAUDE_CODE_EFFORT_LEVEL="max"
```


配置完成后，执行（其中 `/path/to/my-project` 替换为你的项目路径）：


```
cd /path/to/my-projectclaude
```


## 从零安装 Claude Code[​](#从零安装-claude-code)


#### 1. 安装 Claude Code[​](#1-安装-claude-code)


- 安装 [Node.js](https://nodejs.org/zh-cn/download/) 18+。
- Windows 用户需安装 [Git for Windows](https://git-scm.com/download/win)。
- 在命令行界面，执行以下命令安装 Claude Code：


```
npm install -g @anthropic-ai/claude-code
```


- 安装结束后，执行以下命令，若显示版本号则安装成功：


```
claude --version
```


#### 2. 配置环境变量[​](#2-配置环境变量)

Linux / Mac 用户执行以下命令配置 [DeepSeek Anthropic API](https://api.deepseek.com/anthropic) 环境变量，其中 API Key 在 [DeepSeek Platform](https://platform.deepseek.com/api_keys) 获取：


```
export ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropicexport ANTHROPIC_AUTH_TOKEN=export ANTHROPIC_MODEL=deepseek-v4-pro[1m]export ANTHROPIC_DEFAULT_OPUS_MODEL=deepseek-v4-pro[1m]export ANTHROPIC_DEFAULT_SONNET_MODEL=deepseek-v4-pro[1m]export ANTHROPIC_DEFAULT_HAIKU_MODEL=deepseek-v4-flashexport CLAUDE_CODE_SUBAGENT_MODEL=deepseek-v4-flashexport CLAUDE_CODE_EFFORT_LEVEL=max
```


Windows 用户执行：


```
$env:ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic"$env:ANTHROPIC_AUTH_TOKEN=""$env:ANTHROPIC_MODEL="deepseek-v4-pro[1m]"$env:ANTHROPIC_DEFAULT_OPUS_MODEL="deepseek-v4-pro[1m]"$env:ANTHROPIC_DEFAULT_SONNET_MODEL="deepseek-v4-pro[1m]"$env:ANTHROPIC_DEFAULT_HAIKU_MODEL="deepseek-v4-flash"$env:CLAUDE_CODE_SUBAGENT_MODEL="deepseek-v4-flash"$env:CLAUDE_CODE_EFFORT_LEVEL="max"
```


#### 3. 进入项目目录，执行 `claude` 命令，即可开始使用了。[​](#3-进入项目目录执行-claude-命令即可开始使用了)


```
cd /path/to/my-projectclaude
```


![](https://cdn.deepseek.com/api-docs/cc_example.png)