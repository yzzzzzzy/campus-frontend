<template>
  <el-header class="header" :style="{ backgroundColor: bgColor }">
    <h2 class="logo-title" @click="router.push('/home')">{{ title }}</h2>
    
    <div class="header-right">
      <slot></slot>

      <el-popover
        v-if="showDropdown"
        v-model:visible="announcementPopoverVisible"
        trigger="click"
        placement="bottom-end"
        width="360"
        popper-class="announcement-popover"
      >
        <template #reference>
          <el-badge
            :value="announcementUnreadCount"
            :hidden="announcementUnreadCount === 0"
            :max="99"
            class="announcement-badge"
            :offset="[-2, 8]"
          >
            <el-button class="announcement-btn" circle plain :loading="announcementLoading" aria-label="公告栏入口">
              <el-icon><Bell /></el-icon>
            </el-button>
          </el-badge>
        </template>

        <div class="announcement-panel">
          <div class="announcement-panel-header">
            <div>
              <div class="announcement-panel-title">公告栏</div>
              <div class="announcement-panel-subtitle">平台通知与重要提醒</div>
            </div>
            <el-button link type="primary" class="mark-read-btn" @click="markAnnouncementsRead">全部已读</el-button>
          </div>

          <el-scrollbar max-height="320px">
            <div v-if="announcementList.length === 0" class="announcement-empty">
              <el-empty description="暂无公告" :image-size="90" />
            </div>
            <div v-else class="announcement-list">
              <div
                v-for="item in announcementList"
                :key="item.id"
                class="announcement-item"
                :class="{ unread: item.is_new }"
                @click.stop="openAnnouncementDetail(item.id)"
              >
                <div class="announcement-item-head">
                  <span class="announcement-item-title">{{ item.title }}</span>
                  <el-tag v-if="item.is_pinned" size="small" type="danger" effect="plain">置顶</el-tag>
                </div>
                <div class="announcement-item-content">{{ item.content }}</div>
                <div class="announcement-item-meta">
                  <span>{{ formatAnnouncementTime(item.created_at) }}</span>
                  <span v-if="item.is_new" class="announcement-new-dot">新</span>
                </div>
              </div>
            </div>
          </el-scrollbar>
        </div>
      </el-popover>

      <el-dropdown v-if="showDropdown" trigger="hover" @command="handleCommand" class="avatar-dropdown">
        <div class="avatar-wrapper" @click="router.push('/profile')">
          <el-avatar :size="40" :src="userInfo.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
        </div>
        
        <template #dropdown>
          <el-dropdown-menu class="custom-dropdown">
            <div class="dropdown-header">
              <span class="user-name">{{ userInfo.nickname || userInfo.username }}</span>
              <el-tag size="small" :type="Number(userInfo.role) === 1 ? 'danger' : 'success'" effect="dark" class="role-tag">
                {{ Number(userInfo.role) === 1 ? '管理员' : '正式会员' }}
              </el-tag>
            </div>
            <el-dropdown-item command="profile" icon="User">个人中心</el-dropdown-item>
            <el-dropdown-item command="messages" icon="Message">私信</el-dropdown-item>
            <el-dropdown-item command="favorites" icon="Star">我的收藏</el-dropdown-item>
            <el-dropdown-item v-if="Number(userInfo.role) === 1" command="admin" icon="Setting">管理后台</el-dropdown-item>
            <el-dropdown-item divided command="logout" icon="SwitchButton" style="color: #F56C6C;">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </el-header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'
import { ElMessage } from 'element-plus'
import { Bell } from '@element-plus/icons-vue'

const router = useRouter()

// 定义组件接收的参数 (标题和背景色)
defineProps({
  title: { type: String, default: '🎓 校园信息共享平台' },
  bgColor: { type: String, default: '#409EFF' },
  showDropdown: { type: Boolean, default: true }, // 👉 [新增] 默认显示下拉菜单
})

const emit = defineEmits(['show-announcement-detail'])

const userInfo = ref({})
const isComponentActive = ref(true)
const announcementPopoverVisible = ref(false)
const announcementLoading = ref(false)
const announcementUnreadCount = ref(0)
const announcementList = ref([])
let announcementTimer = null

// 获取当前登录用户的信息来渲染头像和昵称
const fetchUserInfo = async () => {
  try {
    const res = await request.get('/api/user/info')
    if (!isComponentActive.value) return
    if (res.data.code === 200) {
      userInfo.value = res.data.data
    }
  } catch (error) {
    console.error('获取用户信息失败')
  }
}

const formatAnnouncementTime = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleString('zh-CN', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadAnnouncements = async () => {
  if (announcementLoading.value) return

  announcementLoading.value = true
  try {
    const res = await request.get('/api/announcements', {
      params: { limit: 5 }
    })

    if (!isComponentActive.value) return

    if (res.data.code === 200) {
      announcementList.value = Array.isArray(res.data.data) ? res.data.data : []
      announcementUnreadCount.value = Number(res.data.unreadCount || 0)
    }
  } catch (error) {
    console.error('获取公告失败')
  } finally {
    announcementLoading.value = false
  }
}

const markAnnouncementsRead = async () => {
  try {
    const res = await request.put('/api/announcements/read')
    if (res.data.code === 200) {
      announcementUnreadCount.value = 0
      announcementList.value = announcementList.value.map((item) => ({
        ...item,
        is_new: false
      }))
      ElMessage.success('公告已标记为已读')
    } else {
      ElMessage.error(res.data.message || '标记已读失败')
    }
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || '标记已读失败')
  }
}

const openAnnouncementDetail = async (announcementId) => {
  announcementPopoverVisible.value = false
  emit('show-announcement-detail', announcementId)
}

// 处理下拉菜单的点击事件
const handleCommand = (command) => {
  if (command === 'logout') {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    ElMessage.success('已安全退出')
    router.push('/login')
  } else if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'favorites') {
    // 👉 [修改] 去掉原来的 ElMessage，改成带参数跳转！
    // 告诉个人中心：我要去 profile 页面，并且我要直接看 favorites 标签页
    router.push({ path: '/profile', query: { tab: 'favorites' } })
  } else if (command === 'messages') {
    router.push({ path: '/profile', query: { tab: 'messages' } })
  } else if (command === 'admin') {
    router.push('/admin')
  }
}

onMounted(() => {
  fetchUserInfo()
  loadAnnouncements()
  announcementTimer = setInterval(loadAnnouncements, 30000)
})

onUnmounted(() => {
  isComponentActive.value = false
  if (announcementTimer) {
    clearInterval(announcementTimer)
    announcementTimer = null
  }
})

defineExpose({ loadAnnouncements })
</script>

<style scoped>
.header {
  width: 100%;
  height: 60px;
  box-sizing: border-box;
  position: sticky;
  top: 0;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-sm);
  padding: 0 var(--gap-xl);
  z-index: 100;
}

.logo-title {
  margin: 0;
  cursor: pointer;
  transition: opacity var(--transition-base);
}

.logo-title:hover {
  opacity: 0.8;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--gap-xl);
}

.announcement-badge {
  display: inline-flex;
  overflow: visible;
}

.announcement-badge :deep(.el-badge__content) {
  min-width: 18px !important;
  height: 18px !important;
  padding: 0 5px !important;
  border: 2px solid #ffffff !important;
  background-color: var(--color-danger) !important;
  color: #ffffff !important;
  font-size: 11px !important;
  line-height: 16px !important;
  box-shadow: var(--shadow-light);
}

.announcement-btn {
  width: 40px;
  height: 40px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  transition: all var(--transition-base);
}

.announcement-btn:hover {
  transform: scale(1.08);
  background: rgba(255, 255, 255, 0.16);
}

.avatar-dropdown {
  cursor: pointer;
  outline: none;
}

.avatar-wrapper {
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  transition: transform var(--transition-base);
}

.avatar-wrapper:hover {
  transform: scale(1.1);
}

.custom-dropdown {
  width: 200px;
}

.dropdown-header {
  padding: var(--gap-xl);
  text-align: center;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: var(--gap-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gap-xs);
}

.user-name {
  font-size: 16px;
  font-weight: bold;
  color: var(--color-text-primary);
}

.announcement-panel {
  display: grid;
  gap: var(--gap-md);
}

.announcement-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--gap-md);
}

.announcement-panel-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.announcement-panel-subtitle {
  margin-top: var(--gap-xs);
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.announcement-list {
  display: grid;
  gap: var(--gap-sm);
}

.announcement-item {
  padding: var(--gap-md);
  border-radius: var(--radius-lg);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 128px;
  max-height: 128px;
  display: flex;
  flex-direction: column;
}

.announcement-item:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-border-light);
}

.announcement-item.unread {
  border-color: rgba(245, 108, 108, 0.28);
  background: linear-gradient(180deg, rgba(255, 248, 248, 1), rgba(255, 255, 255, 1));
}

.announcement-item-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--gap-sm);
  margin-bottom: var(--gap-md);
  flex: 0 0 auto;
}

.announcement-item-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.announcement-item-content {
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
  min-height: 42px;
  flex: 1 1 auto;
}

.announcement-item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--gap-sm);
  margin-top: var(--gap-md);
  font-size: 12px;
  color: var(--color-text-tertiary);
  flex: 0 0 auto;
}

.announcement-new-dot {
  color: #ef4444;
  font-weight: 700;
}

@media (max-width: 768px) {
  .header {
    height: 56px;
    padding: 0 var(--gap-md);
  }

  .logo-title {
    max-width: 52vw;
    font-size: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .header-right {
    gap: var(--gap-sm);
  }

  .announcement-btn {
    width: 36px;
    height: 36px;
  }

  .custom-dropdown {
    width: 170px;
  }

  :deep(.avatar-wrapper .el-avatar) {
    width: 34px;
    height: 34px;
  }
}
</style>