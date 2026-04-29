<template>
  <div class="messages-layout">
    <div class="conversations-col">
      <div class="conversations-header">会话</div>
      <el-input v-model="searchQuery" placeholder="搜索会话或用户名" clearable class="conv-search" @keyup.enter="fetchConversations" />
      <div class="conv-list">
        <div v-for="conv in conversations" :key="conv.id" :class="['conv-item', { active: selectedConversation && selectedConversation.id === conv.id }]" @click="selectConversation(conv)">
          <div class="conv-left">
            <el-avatar :size="40" :src="conv.avatar || defaultAvatar" />
          </div>
          <div class="conv-right">
            <div class="conv-name">{{ conv.peer_name }}</div>
            <div class="conv-preview">{{ conv.last_message_preview || '暂无消息' }}</div>
          </div>
          <div class="conv-meta" @click.stop>
            <el-badge v-if="conv.unread_count && conv.unread_count > 0" :value="conv.unread_count" class="item-badge" />
            <el-button type="danger" link size="small" class="delete-conv-btn" @click="deleteConversation(conv)">删除</el-button>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-col">
      <div v-if="!selectedConversation" class="empty-placeholder">
        请选择一个会话开始私信
      </div>

      <div v-else class="chat-area">
        <div class="chat-header">
          <el-avatar :size="36" :src="selectedConversation.avatar || defaultAvatar" />
          <div class="chat-title">{{ selectedConversation.peer_name }}</div>
        </div>

        <div class="chat-messages" ref="chatContainer">
          <div v-for="msg in messages" :key="msg.id" :class="['chat-message', { me: msg.from_user_id === currentUserId }]">
            <div class="msg-content">{{ msg.content }}</div>
            <div class="msg-time">{{ new Date(msg.created_at).toLocaleString() }}</div>
          </div>
        </div>

        <div class="chat-input">
          <el-input
            v-model="draftMessage"
            type="textarea"
            :rows="2"
            resize="none"
            placeholder="Enter 发送，Ctrl+Enter 换行"
            :disabled="isSending"
            @keydown="handleDraftKeydown"
          />
          <el-button type="primary" @click="sendMessage" :loading="isSending">发送</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const conversations = ref([])
const selectedConversation = ref(null)
const messages = ref([])
const draftMessage = ref('')
const searchQuery = ref('')
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
const currentUserId = Number(JSON.parse(localStorage.getItem('user') || '{}').id || 0)
const chatContainer = ref(null)
const isSending = ref(false)
let pollTimer = null
const route = useRoute()
const router = useRouter()

const fetchConversations = async () => {
  try {
    const res = await request.get('/api/messages/conversations', { params: { q: searchQuery.value } })
    if (res.data.code === 200) {
      conversations.value = res.data.data
    }
  } catch (error) {
    conversations.value = conversations.value || []
  }
}

const fetchMessages = async (convId, page = 1) => {
  try {
    const res = await request.get(`/api/messages/${convId}`, { params: { page, limit: 200 } })
    if (res.data.code === 200) {
      messages.value = res.data.data || []
      await nextTick()
      scrollToBottom()
    }
  } catch (error) {
    messages.value = []
  }
}

const selectConversation = async (conv) => {
  selectedConversation.value = conv
  draftMessage.value = ''
  await fetchMessages(conv.id)

  // 标记为已读
  try {
    await request.put(`/api/conversations/${conv.id}/read`)
    // 刷新会话列表以更新未读数
    await fetchConversations()
  } catch (e) {
    // 忽略标记已读失败
  }

  // 开启轮询，拉取新消息
  startPolling()
}

const deleteConversation = async (conv) => {
  try {
    await ElMessageBox.confirm(`确定要删除与「${conv.peer_name}」的会话吗？删除后消息也会一并清除。`, '删除会话', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await request.delete(`/api/conversations/${conv.id}`)
    if (res.data.code === 200) {
      conversations.value = conversations.value.filter(item => item.id !== conv.id)
      if (selectedConversation.value && selectedConversation.value.id === conv.id) {
        selectedConversation.value = null
        messages.value = []
        stopPolling()
      }
      ElMessage.success('会话已删除')
    } else {
      ElMessage.error(res.data.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.response?.data?.message || '删除失败')
    }
  }
}

const sendMessage = async () => {
  if (!draftMessage.value.trim() || !selectedConversation.value || isSending.value) return
  isSending.value = true
  const payload = {
    conversation_id: selectedConversation.value.id,
    content: draftMessage.value.trim()
  }
  try {
    const res = await request.post('/api/messages', payload)
    if (res.data.code === 200) {
      // 使用后端返回的消息
      messages.value.push(res.data.data)
      draftMessage.value = ''
      await nextTick()
      scrollToBottom()
      await fetchConversations()
    } else {
      // 显示错误提示（如果需要可扩展）
      console.error('发送失败', res.data)
    }
  } catch (error) {
    console.error('发送出错', error)
  } finally {
    isSending.value = false
  }
}

const handleDraftKeydown = (event) => {
  if (event.key !== 'Enter') return

  if (event.ctrlKey) {
    const target = event.target
    const start = target?.selectionStart ?? draftMessage.value.length
    const end = target?.selectionEnd ?? draftMessage.value.length
    const nextValue = `${draftMessage.value.slice(0, start)}\n${draftMessage.value.slice(end)}`
    draftMessage.value = nextValue

    nextTick(() => {
      const nextPos = start + 1
      if (typeof target?.setSelectionRange === 'function') {
        target.setSelectionRange(nextPos, nextPos)
      }
    })
    return
  }

  event.preventDefault()
  sendMessage()
}

const scrollToBottom = () => {
  try {
    const el = chatContainer.value
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  } catch (e) {}
}

const pollMessages = async () => {
  if (!selectedConversation.value) return
  try {
    // 拉取最新消息（不改变分页）
    const res = await request.get(`/api/messages/${selectedConversation.value.id}`, { params: { page: 1, limit: 200 } })
    if (res.data.code === 200) {
      const newMessages = res.data.data || []
      // 简单合并：若长度变化则更新并滚动到底
      if (newMessages.length !== messages.value.length) {
        messages.value = newMessages
        await nextTick()
        scrollToBottom()
      }
    }
  } catch (e) {
    // 忽略轮询错误
  }
}

const startPolling = () => {
  stopPolling()
  pollTimer = setInterval(pollMessages, 5000)
}

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

onMounted(() => {
  fetchConversations()
  // 如果路由里带 conv 参数，等待会话列表拉取完再选中
  const convQuery = route.query.conv || route.query.conversation_id
  if (convQuery) {
    // 拉取会话列表完再选择
    const trySelect = async () => {
      await fetchConversations()
      const match = conversations.value.find(c => String(c.id) === String(convQuery))
      if (match) {
        selectConversation(match)
        // 清理 URL 中的 query，避免重复执行
        router.replace({ path: router.currentRoute.value.path, query: { tab: 'messages' } })
      }
    }
    trySelect()
  }
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.messages-layout {
  display: flex;
  gap: 18px;
  min-height: 0;
  height: 100%;
}
.conversations-col {
  width: 320px;
  background: #fff;
  border: 1px solid #e6edf3;
  border-radius: 8px;
  padding: 12px;
  height: 640px;
  overflow: auto;
  min-height: 0;
}
.conversations-header { font-weight: 700; margin-bottom: 8px; }
.conv-search { margin-bottom: 8px; }
.conv-list { display: flex; flex-direction: column; gap: 8px; }
.conv-item { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 8px; cursor: pointer; }
.conv-item.active { background: #f0f6ff; }
.conv-left { width: 44px; }
.conv-right { flex: 1; }
.conv-name { font-weight: 700; }
.conv-preview { color: #7f8c8d; font-size: 13px; }
.conv-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #ff4d4f; }
.delete-conv-btn { padding: 0; }

.chat-col { flex: 1; background: #fff; border: 1px solid #e6edf3; border-radius: 8px; height: 640px; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
.chat-area { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
.chat-header { display: flex; align-items: center; gap: 12px; padding: 12px; border-bottom: 1px solid #eef2f7; }
.chat-title { font-weight: 700; }
.chat-messages { flex: 1; min-height: 0; padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
.chat-message { max-width: 70%; padding: 10px; border-radius: 8px; background: #f3f6fb; align-self: flex-start; }
.chat-message.me { background: #cfe9ff; align-self: flex-end; }
.msg-time { font-size: 11px; color: #9aa4ad; margin-top: 6px; }
.chat-input { padding: 12px; display: flex; gap: 8px; border-top: 1px solid #eef2f7; flex-shrink: 0; background: #fff; }
.empty-placeholder {
  height: 640px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  background: #fff;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
}
</style>
