// DeepSeek Chat - app.js
(() => {
  'use strict';

  // ============ Storage ============
  const Storage = {
    get(key, fallback = null) {
      try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : fallback;
      } catch { return fallback; }
    },
    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    },
    remove(key) {
      localStorage.removeItem(key);
    }
  };

  // ============ Utils ============
  function throttle(fn, ms) {
    let last = 0;
    let timer = null;
    return function(...args) {
      const now = Date.now();
      if (now - last >= ms) {
        last = now;
        fn.apply(this, args);
      } else if (!timer) {
        timer = setTimeout(() => {
          last = Date.now();
          timer = null;
          fn.apply(this, args);
        }, ms - (now - last));
      }
    };
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatDateGroup(ts) {
    const d = new Date(ts);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today - 86400000);
    const convDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (convDate.getTime() === today.getTime()) return '今天';
    if (convDate.getTime() === yesterday.getTime()) return '昨天';
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ============ File Upload ============
  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file, 'UTF-8');
    });
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFiles(fileList) {
    for (const file of fileList) {
      if (attachments.length >= 10) break;
      const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(file.name);
      let content;
      try {
        if (isImage) {
          content = await readFileAsDataURL(file);
        } else {
          content = await readFileAsText(file);
        }
      } catch (err) {
        console.error('文件读取失败:', file.name, err);
        continue;
      }
      if (!isImage) {
        console.log('读取文件:', file.name, '类型:', file.type, '内容长度:', content?.length);
        if (!content || content.trim() === '') {
          console.warn('文件内容为空:', file.name);
        }
      }
      attachments.push({
        name: file.name,
        size: file.size,
        type: file.type,
        content: content || '',
        isImage
      });
    }
    renderAttachments();
    els.sendBtn.disabled = false;
  }

  function removeAttachment(index) {
    attachments.splice(index, 1);
    renderAttachments();
    els.sendBtn.disabled = !els.messageInput.value.trim() && attachments.length === 0;
  }

  function renderAttachments() {
    if (attachments.length === 0) {
      els.attachmentPreview.classList.add('hidden');
      els.attachmentPreview.innerHTML = '';
      return;
    }
    els.attachmentPreview.classList.remove('hidden');
    els.attachmentPreview.innerHTML = attachments.map((a, i) => {
      if (a.isImage) {
        return `<div class="attachment-chip">
          <img class="attachment-chip-preview" src="${a.content}" alt="${escapeHtml(a.name)}">
          <span class="attachment-chip-name">${escapeHtml(a.name)}</span>
          <button class="attachment-chip-remove" data-index="${i}" title="移除">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>`;
      }
      return `<div class="attachment-chip">
        <span class="attachment-chip-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </span>
        <span class="attachment-chip-name">${escapeHtml(a.name)}</span>
        <span class="attachment-chip-size">${formatFileSize(a.size)}</span>
        <button class="attachment-chip-remove" data-index="${i}" title="移除">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>`;
    }).join('');
  }

  // ============ Conversation Manager ============
  const CONV_KEY = 'ds_conversations';
  const SETTINGS_KEY = 'ds_settings';

  function getConversations() {
    return Storage.get(CONV_KEY, []);
  }

  function saveConversations(convs) {
    Storage.set(CONV_KEY, convs);
  }

  function createConversation() {
    const convs = getConversations();
    const conv = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: '新建对话',
      messages: [],
      model: getSettings().model || 'deepseek-v4-flash',
      createdAt: Date.now()
    };
    convs.unshift(conv);
    saveConversations(convs);
    return conv;
  }

  function getConversation(id) {
    return getConversations().find(c => c.id === id) || null;
  }

  function updateConversation(id, updates) {
    const convs = getConversations();
    const idx = convs.findIndex(c => c.id === id);
    if (idx !== -1) {
      Object.assign(convs[idx], updates);
      saveConversations(convs);
    }
  }

  function deleteConversation(id) {
    const convs = getConversations().filter(c => c.id !== id);
    saveConversations(convs);
  }

  function autoTitle(conv) {
    const first = conv.messages.find(m => m.role === 'user');
    if (first) {
      conv.title = first.content.slice(0, 30) + (first.content.length > 30 ? '...' : '');
    }
  }

  // ============ Settings ============
  function getSettings() {
    return Storage.get(SETTINGS_KEY, {
      apiKey: '',
      apiUrl: 'https://api.deepseek.com',
      model: 'deepseek-v4-flash',
      systemPrompt: '',
      temperature: 1,
      thinkingEnabled: true,
      reasoningEffort: 'high'
    });
  }

  function saveSettings(settings) {
    Storage.set(SETTINGS_KEY, settings);
  }

  // ============ DeepSeek API ============
  const DEFAULT_API_URL = 'https://api.deepseek.com';

  function resolveApiUrl(baseUrl) {
    const url = (baseUrl || DEFAULT_API_URL).replace(/\/+$/, '');
    return url.endsWith('/chat/completions') ? url : url + '/chat/completions';
  }

  let abortController = null;

  async function* streamChat(messages, model) {
    const settings = getSettings();
    if (!settings.apiKey) {
      throw new Error('请先在设置中填写 API 密钥。');
    }

    abortController = new AbortController();

    const body = {
      model,
      messages,
      stream: true
    };

    // Thinking mode (DeepSeek-specific)
    const apiUrl = resolveApiUrl(settings.apiUrl);
    const isDeepSeek = apiUrl.includes('deepseek.com');
    if (isDeepSeek) {
      if (settings.thinkingEnabled !== false) {
        body.thinking = { type: 'enabled', reasoning_effort: settings.reasoningEffort || 'high' };
      } else {
        body.thinking = { type: 'disabled' };
        body.temperature = parseFloat(settings.temperature || 0.7);
      }
    } else {
      body.temperature = parseFloat(settings.temperature || 0.7);
    }

    const resp = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify(body),
      signal: abortController.signal
    });

    if (!resp.ok) {
      const err = await resp.text();
      let msg = `API error (${resp.status})`;
      try {
        const j = JSON.parse(err);
        msg = j.error?.message || msg;
      } catch {}
      throw new Error(msg);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta;
          if (delta) {
            yield delta;
          }
        } catch {}
      }
    }
  }

  function stopStreaming() {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  }

  // ============ Markdown Renderer ============
  const renderer = new marked.Renderer();

  renderer.code = function(token) {
    const code = token.text;
    const lang = (token.lang || '').match(/^\S*/)?.[0] || '';
    const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
    let highlighted;
    try {
      highlighted = hljs.highlight(code, { language }).value;
    } catch {
      highlighted = hljs.highlightAuto(code).value;
    }
    const header = lang
      ? `<div class="code-header"><span>${lang}</span><button class="copy-code-btn" onclick="copyCode(this)">复制</button></div>`
      : `<div class="code-header"><span></span><button class="copy-code-btn" onclick="copyCode(this)">复制</button></div>`;
    return `<pre>${header}<code class="hljs language-${language}">${highlighted}</code></pre>`;
  };

  marked.setOptions({
    renderer,
    gfm: true,
    breaks: true
  });

  window.copyCode = function(btn) {
    const code = btn.closest('pre').querySelector('code');
    navigator.clipboard.writeText(code.textContent).catch(() => {});
    btn.textContent = '已复制';
    setTimeout(() => { btn.textContent = '复制'; }, 2000);
  };

  // ============ UI ============
  const $ = (sel) => document.querySelector(sel);

  const els = {
    sidebar: $('#sidebar'),
    sidebarToggle: $('#sidebarToggle'),
    conversationList: $('#conversationList'),
    newChatBtn: $('#newChatBtn'),
    settingsBtn: $('#settingsBtn'),
    modelSelect: $('#modelSelect'),
    topbarTitle: $('#topbarTitle'),
    clearChatBtn: $('#clearChatBtn'),
    chatContainer: $('#chatContainer'),
    welcomeScreen: $('#welcomeScreen'),
    messages: $('#messages'),
    messageInput: $('#messageInput'),
    sendBtn: $('#sendBtn'),
    stopBtn: $('#stopBtn'),
    thinkBtn: $('#thinkBtn'),
    thinkEffort: $('#thinkEffort'),
    attachBtn: $('#attachBtn'),
    fileInput: $('#fileInput'),
    attachmentPreview: $('#attachmentPreview'),
    settingsModal: $('#settingsModal'),
    closeSettingsBtn: $('#closeSettingsBtn'),
    apiKeyInput: $('#apiKeyInput'),
    apiUrlInput: $('#apiUrlInput'),
    systemPromptInput: $('#systemPromptInput'),
    temperatureInput: $('#temperatureInput'),
    temperatureValue: $('#temperatureValue'),
    saveSettingsBtn: $('#saveSettingsBtn')
  };

  let currentConvId = null;
  let isStreaming = false;
  let attachments = []; // { name, size, type, content (text or base64), isImage }

  // ============ Sidebar ============
  function renderConversationList() {
    const convs = getConversations();
    if (convs.length === 0) {
      els.conversationList.innerHTML = '';
      return;
    }

    let html = '';
    let lastGroup = '';

    for (const c of convs) {
      const group = formatDateGroup(c.createdAt);
      if (group !== lastGroup) {
        html += `<div class="conv-group-title">${group}</div>`;
        lastGroup = group;
      }
      html += `
        <div class="conv-item ${c.id === currentConvId ? 'active' : ''}" data-id="${c.id}">
          <span class="conv-item-title" data-id="${c.id}">${escapeHtml(c.title)}</span>
          <div class="conv-item-actions">
            <button class="conv-item-btn" data-action="rename" data-id="${c.id}" title="重命名">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
            </button>
            <button class="conv-item-btn danger" data-action="delete" data-id="${c.id}" title="删除">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>`;
    }

    els.conversationList.innerHTML = html;
  }

  function startRename(id) {
    const conv = getConversation(id);
    if (!conv) return;
    const item = els.conversationList.querySelector(`.conv-item[data-id="${id}"]`);
    if (!item) return;
    const titleEl = item.querySelector('.conv-item-title');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'conv-rename-input';
    input.value = conv.title;
    titleEl.replaceWith(input);
    input.focus();
    input.select();

    const finish = () => {
      const newTitle = input.value.trim() || conv.title;
      updateConversation(id, { title: newTitle });
      if (currentConvId === id) {
        els.topbarTitle.textContent = newTitle;
      }
      renderConversationList();
    };

    input.addEventListener('blur', finish);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { input.value = conv.title; input.blur(); }
    });
  }

  // ============ Messages ============
  function renderMessages() {
    const conv = getConversation(currentConvId);
    if (!conv || conv.messages.length === 0) {
      els.welcomeScreen.classList.remove('hidden');
      els.messages.classList.add('hidden');
      els.messages.innerHTML = '';
      return;
    }

    els.welcomeScreen.classList.add('hidden');
    els.messages.classList.remove('hidden');

    els.messages.innerHTML = conv.messages.map((m, i) => renderMessage(m, i)).join('');
    scrollToBottom();
  }

  function renderMessage(msg, index) {
    const isUser = msg.role === 'user';
    const avatar = isUser ? 'U' : 'DS';
    let content = '';

    // Render attachments
    if (msg.attachments && msg.attachments.length > 0) {
      content += '<div class="message-files">';
      for (const a of msg.attachments) {
        if (a.isImage) {
          content += `<img class="message-image" src="${a.content}" alt="${escapeHtml(a.name)}">`;
        } else {
          content += `<div class="message-file-chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>${escapeHtml(a.name)}</span>
          </div>`;
        }
      }
      content += '</div>';
    }

    if (msg.reasoning) {
      content += `<div class="reasoning-block">
        <div class="reasoning-header" onclick="toggleReasoning(this)">
          <span class="reasoning-arrow">&#9654;</span> 已深度思考
        </div>
        <div class="reasoning-content">${marked.parse(msg.reasoning)}</div>
      </div>`;
    }

    content += marked.parse(msg.content || '');

    // Action buttons
    let actions = '';
    if (isUser) {
      actions = `<div class="message-actions">
        <button class="msg-action-btn" data-action="edit" data-index="${index}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          编辑
        </button>
      </div>`;
    } else {
      actions = `<div class="message-actions">
        <button class="msg-action-btn" data-action="regenerate" data-index="${index}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          重新生成
        </button>
      </div>`;
    }

    return `<div class="message ${msg.role}" data-index="${index}">
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">${content}${actions}</div>
    </div>`;
  }

  window.toggleReasoning = function(header) {
    const arrow = header.querySelector('.reasoning-arrow');
    const content = header.nextElementSibling;
    arrow.classList.toggle('open');
    content.classList.toggle('open');
  };

  function appendStreamingMessage() {
    els.welcomeScreen.classList.add('hidden');
    els.messages.classList.remove('hidden');

    const div = document.createElement('div');
    div.className = 'message assistant';
    div.id = 'streaming-msg';
    div.innerHTML = `
      <div class="message-avatar">DS</div>
      <div class="message-content">
        <div class="typing-indicator"><span></span><span></span><span></span></div>
      </div>
    `;
    els.messages.appendChild(div);
    scrollToBottom();
    return div;
  }

  function updateStreamingMessage(div, text, reasoning) {
    const content = div.querySelector('.message-content');
    let html = '';

    if (reasoning) {
      html += `<div class="reasoning-block">
        <div class="reasoning-header" onclick="toggleReasoning(this)">
          <span class="reasoning-arrow">&#9654;</span> 思考中...
        </div>
        <div class="reasoning-content open">${marked.parse(reasoning)}</div>
      </div>`;
    }

    html += marked.parse(text || '');
    content.innerHTML = html;
    scrollToBottom();
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      els.chatContainer.scrollTop = els.chatContainer.scrollHeight;
    });
  }

  // ============ Message Actions ============
  function editMessage(index) {
    if (isStreaming) return;
    const conv = getConversation(currentConvId);
    if (!conv) return;
    const msg = conv.messages[index];
    if (!msg || msg.role !== 'user') return;

    // Put message content into input
    els.messageInput.value = msg.content || '';
    els.messageInput.style.height = 'auto';
    els.messageInput.style.height = Math.min(els.messageInput.scrollHeight, 200) + 'px';
    els.messageInput.focus();

    // Restore attachments if any
    if (msg.attachments && msg.attachments.length > 0) {
      attachments = [...msg.attachments];
      renderAttachments();
    }

    // Truncate conversation from this message onwards
    conv.messages = conv.messages.slice(0, index);
    updateConversation(currentConvId, { messages: conv.messages });
    renderMessages();

    // Update send button state
    els.sendBtn.disabled = false;
  }

  function regenerateMessage(index) {
    if (isStreaming) return;
    const conv = getConversation(currentConvId);
    if (!conv) return;
    const msg = conv.messages[index];
    if (!msg || msg.role !== 'assistant') return;

    // Find the previous user message
    let userMsgIndex = -1;
    for (let i = index - 1; i >= 0; i--) {
      if (conv.messages[i].role === 'user') {
        userMsgIndex = i;
        break;
      }
    }
    if (userMsgIndex === -1) return;

    // Remove assistant message and all after it
    conv.messages = conv.messages.slice(0, index);
    updateConversation(currentConvId, { messages: conv.messages });
    renderMessages();

    // Re-trigger sending with the user message content
    const userMsg = conv.messages[userMsgIndex];
    if (userMsg.attachments && userMsg.attachments.length > 0) {
      attachments = [...userMsg.attachments];
    }
    // Remove the user message too since sendMessage will re-add it
    conv.messages = conv.messages.slice(0, userMsgIndex);
    updateConversation(currentConvId, { messages: conv.messages });
    renderMessages();
    sendMessage(userMsg.content || '');
  }

  // ============ Chat Actions ============
  async function sendMessage(content) {
    if ((!content.trim() && attachments.length === 0) || isStreaming) return;

    const settings = getSettings();
    if (!settings.apiKey) {
      openSettings();
      return;
    }

    if (!currentConvId) {
      const conv = createConversation();
      currentConvId = conv.id;
    }

    const targetConvId = currentConvId;
    const conv = getConversation(targetConvId);
    const currentAttachments = [...attachments];
    conv.messages.push({ role: 'user', content: content.trim(), attachments: currentAttachments.length > 0 ? currentAttachments : undefined });
    autoTitle(conv);
    updateConversation(targetConvId, { messages: conv.messages, title: conv.title });
    attachments = [];
    renderAttachments();
    renderConversationList();
    renderMessages();

    // Build API messages
    const apiMessages = [];
    const s = getSettings();
    if (s.systemPrompt) {
      apiMessages.push({ role: 'system', content: s.systemPrompt });
    }
    for (const m of conv.messages) {
      if (m.attachments && m.attachments.length > 0) {
        // Use multimodal content format
        const parts = [];
        // Add text files as text content
        let textContent = m.content || '';
        for (const a of m.attachments) {
          if (a.isImage) {
            parts.push({ type: 'image_url', image_url: { url: a.content } });
          } else {
            textContent += `\n\n--- 文件: ${a.name} ---\n${a.content}\n---`;
          }
        }
        if (textContent.trim()) {
          parts.unshift({ type: 'text', text: textContent });
        }
        const finalContent = parts.length === 1 && parts[0].type === 'text' ? parts[0].text : parts;
        console.log('发送消息:', { role: m.role, content: finalContent });
        apiMessages.push({ role: m.role, content: finalContent });
      } else {
        apiMessages.push({ role: m.role, content: m.content });
      }
    }

    isStreaming = true;
    els.sendBtn.classList.add('hidden');
    els.stopBtn.classList.remove('hidden');
    els.messageInput.disabled = true;

    const streamDiv = appendStreamingMessage();
    let fullText = '';
    let reasoningText = '';
    const throttledUpdate = throttle(updateStreamingMessage, 100);

    try {
      const model = conv.model || settings.model;
      for await (const delta of streamChat(apiMessages, model)) {
        if (delta.content) {
          fullText += delta.content;
        }
        if (delta.reasoning_content) {
          reasoningText += delta.reasoning_content;
        }
        throttledUpdate(streamDiv, fullText, reasoningText);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        fullText += '\n\n*[已停止生成]*';
      } else {
        fullText = `错误: ${err.message}`;
      }
      updateStreamingMessage(streamDiv, fullText, reasoningText);
    } finally {
      isStreaming = false;
      abortController = null;
      els.sendBtn.classList.remove('hidden');
      els.stopBtn.classList.add('hidden');
      els.messageInput.disabled = false;
      els.messageInput.focus();

      if (fullText) {
        const targetConv = getConversation(targetConvId);
        if (targetConv) {
          const assistantMsg = { role: 'assistant', content: fullText };
          if (reasoningText) assistantMsg.reasoning = reasoningText;
          targetConv.messages.push(assistantMsg);
          updateConversation(targetConvId, { messages: targetConv.messages });
        }
      }

      streamDiv.remove();
      renderMessages();
    }
  }

  // ============ Event Handlers ============
  function init() {
    const settings = getSettings();
    els.modelSelect.value = settings.model;

    // Think button state
    if (settings.thinkingEnabled !== false) {
      els.thinkBtn.classList.add('active');
      els.thinkEffort.classList.add('show');
      els.thinkEffort.value = settings.reasoningEffort || 'high';
    }

    renderConversationList();

    if (getConversations().length === 0) {
      els.welcomeScreen.classList.remove('hidden');
    } else {
      const convs = getConversations();
      currentConvId = convs[0].id;
      els.modelSelect.value = convs[0].model || settings.model;
      renderConversationList();
      renderMessages();
      els.topbarTitle.textContent = convs[0].title;
    }

    // Input handling
    function updateSendBtn() {
      els.sendBtn.disabled = !els.messageInput.value.trim() && attachments.length === 0;
    }

    els.messageInput.addEventListener('input', () => {
      els.messageInput.style.height = 'auto';
      els.messageInput.style.height = Math.min(els.messageInput.scrollHeight, 200) + 'px';
      updateSendBtn();
    });

    els.messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const content = els.messageInput.value;
        if (content.trim() || attachments.length > 0) {
          els.messageInput.value = '';
          els.messageInput.style.height = 'auto';
          els.sendBtn.disabled = true;
          sendMessage(content);
        }
      }
    });

    els.sendBtn.addEventListener('click', () => {
      const content = els.messageInput.value;
      if (content.trim() || attachments.length > 0) {
        els.messageInput.value = '';
        els.messageInput.style.height = 'auto';
        els.sendBtn.disabled = true;
        sendMessage(content);
      }
    });

    els.stopBtn.addEventListener('click', stopStreaming);

    // File upload
    els.attachBtn.addEventListener('click', () => els.fileInput.click());
    els.fileInput.addEventListener('change', async (e) => {
      if (e.target.files.length > 0) {
        await handleFiles(e.target.files);
        e.target.value = '';
      }
    });
    els.attachmentPreview.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.attachment-chip-remove');
      if (removeBtn) {
        removeAttachment(parseInt(removeBtn.dataset.index));
      }
    });

    // Drag and drop
    els.chatContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
    els.chatContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    });

    // Paste images
    document.addEventListener('paste', (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files = [];
      for (const item of items) {
        if (item.kind === 'file') {
          files.push(item.getAsFile());
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        handleFiles(files);
      }
    });

    // Message actions (edit/regenerate)
    els.messages.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('.msg-action-btn');
      if (!actionBtn) return;
      const action = actionBtn.dataset.action;
      const index = parseInt(actionBtn.dataset.index);
      if (action === 'edit') {
        editMessage(index);
      } else if (action === 'regenerate') {
        regenerateMessage(index);
      }
    });

    // Think button
    els.thinkBtn.addEventListener('click', () => {
      const settings = getSettings();
      settings.thinkingEnabled = !settings.thinkingEnabled;
      saveSettings(settings);
      els.thinkBtn.classList.toggle('active', settings.thinkingEnabled);
      els.thinkEffort.classList.toggle('show', settings.thinkingEnabled);
    });

    // Think effort
    els.thinkEffort.addEventListener('change', () => {
      const settings = getSettings();
      settings.reasoningEffort = els.thinkEffort.value;
      saveSettings(settings);
    });

    // New chat
    els.newChatBtn.addEventListener('click', () => {
      const conv = createConversation();
      currentConvId = conv.id;
      els.modelSelect.value = conv.model;
      els.topbarTitle.textContent = conv.title;
      renderConversationList();
      renderMessages();
      els.messageInput.focus();
    });

    // Conversation list clicks
    els.conversationList.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        e.stopPropagation();
        const action = actionBtn.dataset.action;
        const id = actionBtn.dataset.id;

        if (action === 'delete') {
          if (confirm('确定删除该对话？')) {
            deleteConversation(id);
            if (currentConvId === id) {
              const convs = getConversations();
              if (convs.length > 0) {
                currentConvId = convs[0].id;
                els.topbarTitle.textContent = convs[0].title;
              } else {
                currentConvId = null;
                els.topbarTitle.textContent = 'DeepSeek 对话';
              }
            }
            renderConversationList();
            renderMessages();
          }
        } else if (action === 'rename') {
          startRename(id);
        }
        return;
      }

      const titleEl = e.target.closest('.conv-item-title');
      if (titleEl) {
        const id = titleEl.dataset.id;
        currentConvId = id;
        const conv = getConversation(currentConvId);
        if (conv) {
          els.modelSelect.value = conv.model || getSettings().model;
          els.topbarTitle.textContent = conv.title;
        }
        renderConversationList();
        renderMessages();
        return;
      }

      const item = e.target.closest('.conv-item');
      if (item) {
        currentConvId = item.dataset.id;
        const conv = getConversation(currentConvId);
        if (conv) {
          els.modelSelect.value = conv.model || getSettings().model;
          els.topbarTitle.textContent = conv.title;
        }
        renderConversationList();
        renderMessages();
      }
    });

    // Model selector
    els.modelSelect.addEventListener('change', () => {
      if (currentConvId) {
        updateConversation(currentConvId, { model: els.modelSelect.value });
      }
      const settings = getSettings();
      settings.model = els.modelSelect.value;
      saveSettings(settings);
    });

    // Clear chat
    els.clearChatBtn.addEventListener('click', () => {
      if (!currentConvId) return;
      if (!confirm('确定清空当前对话的所有消息？')) return;
      updateConversation(currentConvId, { messages: [], title: '新建对话' });
      renderConversationList();
      renderMessages();
      els.topbarTitle.textContent = '新建对话';
    });

    // Sidebar toggle
    els.sidebarToggle.addEventListener('click', () => {
      els.sidebar.classList.toggle('open');
    });

    // Close sidebar on backdrop click (mobile)
    document.addEventListener('click', (e) => {
      if (els.sidebar.classList.contains('open') &&
          !els.sidebar.contains(e.target) &&
          e.target !== els.sidebarToggle &&
          !els.sidebarToggle.contains(e.target)) {
        els.sidebar.classList.remove('open');
      }
    });

    // Settings
    els.settingsBtn.addEventListener('click', openSettings);
    els.closeSettingsBtn.addEventListener('click', closeSettings);
    els.settingsModal.addEventListener('click', (e) => {
      if (e.target === els.settingsModal) closeSettings();
    });

    els.saveSettingsBtn.addEventListener('click', () => {
      const settings = getSettings();
      settings.apiKey = els.apiKeyInput.value.trim();
      settings.apiUrl = els.apiUrlInput.value.trim();
      settings.systemPrompt = els.systemPromptInput.value.trim();
      settings.temperature = parseFloat(els.temperatureInput.value || 1);
      saveSettings(settings);
      closeSettings();
    });

    if (els.temperatureInput) {
      els.temperatureInput.addEventListener('input', (e) => {
        if (els.temperatureValue) {
          els.temperatureValue.textContent = parseFloat(e.target.value).toFixed(1);
        }
      });
    }

    els.messageInput.focus();
  }

  function openSettings() {
    const settings = getSettings();
    els.apiKeyInput.value = settings.apiKey || '';
    els.apiUrlInput.value = settings.apiUrl || '';
    els.systemPromptInput.value = settings.systemPrompt || '';
    els.temperatureInput.value = settings.temperature || 1;
    els.temperatureValue.textContent = parseFloat(settings.temperature || 1).toFixed(1);
    els.settingsModal.classList.remove('hidden');
  }

  function closeSettings() {
    els.settingsModal.classList.add('hidden');
  }

  // ============ Init ============
  document.addEventListener('DOMContentLoaded', init);
})();
