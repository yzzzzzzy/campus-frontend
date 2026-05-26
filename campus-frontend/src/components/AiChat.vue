<template>
  <!-- 悬浮按钮 -->
  <div class="ai-fab" @click="toggleChat" :class="{ active: visible }">
    <el-icon :size="24"><ChatDotRound /></el-icon>
  </div>

  <!-- 聊天面板 -->
  <transition name="slide-up">
    <div v-if="visible" class="ai-panel">
      <div class="ai-panel-header">
        <span>🤖 小c · 校园助手</span>
        <div class="ai-panel-actions">
          <el-button link @click="clearChat" title="清除对话">
            <el-icon><Delete /></el-icon>
          </el-button>
          <el-button link @click="visible = false">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>

      <div class="ai-messages" ref="messagesRef">
        <div v-if="messages.length === 0" class="ai-welcome">
          <p>👋 你好！我是校园助手小c</p>
          <p class="ai-hint">关于升学、就业、竞赛、校园生活等问题都可以问我～</p>
        </div>
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          :class="['ai-message', msg.role]"
        >
          <div class="ai-avatar">{{ msg.role === 'user' ? '😊' : '🤖' }}</div>
          <div class="ai-bubble" v-html="renderMarkdown(msg.content)"></div>
        </div>
        <div v-if="streaming" class="ai-message assistant">
          <div class="ai-avatar">🤖</div>
          <div class="ai-bubble streaming">
            <span v-html="renderMarkdown(streamContent)"></span>
            <span class="cursor">|</span>
          </div>
        </div>
      </div>

      <div class="ai-input-area">
        <el-input
          v-model="inputText"
          placeholder="输入你的问题..."
          @keyup.enter="sendMessage"
          :disabled="streaming"
          clearable
        >
          <template #append>
            <el-button
              @click="sendMessage"
              :loading="streaming"
              :disabled="!inputText.trim()"
              type="primary"
            >
              <el-icon><Promotion /></el-icon>
            </el-button>
          </template>
        </el-input>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import { useAuthStore } from '../stores/auth'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

const visible = ref(false)
const inputText = ref('')
const messages = ref([])
const streaming = ref(false)
const streamContent = ref('')
const messagesRef = ref(null)

const toggleChat = () => {
  visible.value = !visible.value
}

const renderMarkdown = (text) => {
  if (!text) return ''
  // 先转义 HTML，防止 XSS 注入
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

const sendMessage = async () => {
  const text = inputText.value.trim()
  if (!text || streaming.value) return

  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  streaming.value = true
  streamContent.value = ''
  await scrollToBottom()

  try {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) {
      messages.value.push({ role: 'assistant', content: '❌ 请先登录' })
      streaming.value = false
      return
    }

    const response = await fetch(`${API_BASE}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      },
      body: JSON.stringify({ message: text })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: '请求失败' }))
      messages.value.push({ role: 'assistant', content: `❌ ${err.message || '请求失败'}` })
      streaming.value = false
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            if (streamContent.value) {
              messages.value.push({ role: 'assistant', content: streamContent.value })
              streamContent.value = ''
            }
          } else {
            try {
              const parsed = JSON.parse(data)
              if (parsed.error) {
                messages.value.push({ role: 'assistant', content: `❌ ${parsed.error}` })
                streamContent.value = ''
              } else if (parsed.content) {
                streamContent.value += parsed.content
                await scrollToBottom()
              }
            } catch { /* skip */ }
          }
        }
      }
    }
  } catch (error) {
    console.error('AI 请求失败:', error)
    if (streamContent.value) {
      messages.value.push({ role: 'assistant', content: streamContent.value })
    } else {
      messages.value.push({ role: 'assistant', content: '❌ 网络异常，请稍后重试' })
    }
    streamContent.value = ''
  } finally {
    streaming.value = false
  }
}

const clearChat = () => {
  messages.value = []
}

watch(() => visible.value, async (val) => {
  if (val) await scrollToBottom()
})
</script>

<style scoped>
.ai-fab {
  position: fixed;
  bottom: 80px;
  right: 30px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409EFF, #67C23A);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.35);
  z-index: 2000;
  transition: transform 0.3s, box-shadow 0.3s;
}
.ai-fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 24px rgba(64, 158, 255, 0.5);
}
.ai-fab.active {
  background: linear-gradient(135deg, #F56C6C, #E6A23C);
}

.ai-panel {
  position: fixed;
  bottom: 150px;
  right: 30px;
  width: 400px;
  height: 560px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.12);
  display: flex;
  flex-direction: column;
  z-index: 1999;
  overflow: hidden;
}
.ai-panel-header {
  padding: 14px 18px;
  background: linear-gradient(135deg, #409EFF, #337ecc);
  color: #fff;
  font-weight: 700;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ai-panel-actions {
  display: flex;
  gap: 4px;
}
.ai-panel-actions .el-button {
  color: #fff;
}

.ai-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f5f7fa;
}
.ai-welcome {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}
.ai-hint {
  font-size: 12px;
  margin-top: 8px;
  color: #c0c4cc;
}
.ai-message {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}
.ai-message.user {
  flex-direction: row-reverse;
}
.ai-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  background: #fff;
}
.ai-bubble {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}
.ai-message.user .ai-bubble {
  background: #409EFF;
  color: #fff;
  border-bottom-right-radius: 4px;
}
.ai-message.assistant .ai-bubble {
  background: #fff;
  color: #303133;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.ai-bubble.streaming .cursor {
  animation: blink 0.8s infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.ai-input-area {
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  background: #fff;
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
