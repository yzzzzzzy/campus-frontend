<template>
  <div class="admin-page">
    <div class="ambient ambient-one"></div>
    <div class="ambient ambient-two"></div>

    <el-container class="admin-shell">
      <el-aside class="admin-aside" width="260px">
        <div class="brand-block">
          <div class="brand-mark">A</div>
          <div>
            <div class="brand-title">Admin Console</div>
            <div class="brand-subtitle">Campus Hub Control Room</div>
          </div>
        </div>

        <el-menu
          :default-active="activeSection"
          class="admin-menu"
          background-color="transparent"
          text-color="rgba(255,255,255,0.72)"
          active-text-color="#ffffff"
          @select="activeSection = $event"
        >
          <el-menu-item index="overview">
            <el-icon><DataLine /></el-icon>
            <span>数据看板</span>
          </el-menu-item>
          <el-menu-item index="users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="posts">
            <el-icon><Document /></el-icon>
            <span>内容审核</span>
          </el-menu-item>
          <el-menu-item index="resetRequests">
            <el-icon><ChatDotSquare /></el-icon>
            <span>密码申诉</span>
          </el-menu-item>
        </el-menu>

        <div class="aside-footer">
          <div class="assistant-card">
            <div class="assistant-label">当前登录</div>
            <div class="assistant-name">{{ currentUser?.nickname || currentUser?.username || '管理员' }}</div>
            <el-tag type="danger" effect="dark" round>Admin</el-tag>
          </div>

          <el-button type="primary" class="home-btn" @click="router.push('/home')">
            返回前台
          </el-button>
        </div>
      </el-aside>

      <el-container class="admin-main-wrap">
        <el-header class="admin-topbar">
          <div>
            <div class="page-kicker">Dashboard</div>
            <h1 class="page-title">{{ sectionTitle }}</h1>
          </div>
          <div class="topbar-actions">
            <el-button plain @click="refreshAll" :loading="loading">
              <el-icon><RefreshRight /></el-icon>
              刷新数据
            </el-button>
            <el-button type="danger" plain @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>
              退出
            </el-button>
          </div>
        </el-header>

        <el-main class="admin-main">
          <section v-if="activeSection === 'overview'" class="overview-section">
            <div class="stats-grid">
              <el-card v-for="item in statCards" :key="item.label" class="stat-card" shadow="never">
                <div class="stat-label">{{ item.label }}</div>
                <div class="stat-value">{{ item.value }}</div>
                <div class="stat-hint">{{ item.hint }}</div>
              </el-card>
            </div>

            <el-card class="panel-card" shadow="never">
              <template #header>
                <div class="panel-header">
                  <span>系统概览</span>
                  <el-tag type="info" effect="plain">实时统计</el-tag>
                </div>
              </template>
              <div class="overview-note">
                这里先放最核心的总览指标，后续可以继续扩展访问趋势、举报处理量和活跃度曲线。
              </div>
            </el-card>
          </section>

          <section v-else-if="activeSection === 'users'" class="table-section">
            <el-card class="panel-card" shadow="never">
              <template #header>
                <div class="panel-header">
                  <span>用户检索</span>
                  <div class="inline-actions">
                    <el-input v-model="userFilters.keyword" placeholder="学号 / 昵称 / 专业 / 技能" clearable class="search-input" />
                    <el-select v-model="userFilters.status" placeholder="账号状态" clearable class="filter-select">
                      <el-option label="正常" :value="'1'" />
                      <el-option label="封禁" :value="'0'" />
                    </el-select>
                    <el-button type="primary" @click="loadUsers" :loading="usersLoading">搜索</el-button>
                  </div>
                </div>
              </template>

              <el-table :data="users" v-loading="usersLoading" stripe class="data-table" :row-key="row => row.id">
                <el-table-column prop="username" label="学号 / 账号" min-width="140" />
                <el-table-column prop="nickname" label="昵称" min-width="120" />
                <el-table-column prop="major" label="专业" min-width="160" show-overflow-tooltip />
                <el-table-column prop="created_at" label="注册时间" min-width="180" />
                <el-table-column label="身份" width="110">
                  <template #default="scope">
                    <el-tag :type="Number(scope.row.role) === 1 ? 'danger' : 'success'" effect="dark">
                      {{ Number(scope.row.role) === 1 ? '管理员' : '用户' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="状态" width="140">
                  <template #default="scope">
                    <el-switch
                      :model-value="Number(scope.row.status) === 1"
                      active-text="正常"
                      inactive-text="封禁"
                      inline-prompt
                      @change="value => handleUserStatusToggle(scope.row, value)"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="220" fixed="right">
                  <template #default="scope">
                    <div class="user-actions">
                      <el-button size="small" type="danger" plain @click="toggleUserStatusQuick(scope.row)">
                        {{ Number(scope.row.status) === 1 ? '封禁' : '解封' }}
                      </el-button>
                      <el-button size="small" type="warning" plain @click="handleResetUserPassword(scope.row)">
                        重置密码
                      </el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </section>

          <section v-else-if="activeSection === 'posts'" class="table-section">
            <el-card class="panel-card" shadow="never">
              <template #header>
                <div class="panel-header">
                  <span>帖子检索</span>
                  <div class="inline-actions">
                    <el-input v-model="postFilters.keyword" placeholder="关键词：标题 / 内容 / 作者" clearable class="search-input" />
                    <el-input v-model="postFilters.username" placeholder="发帖人学号" clearable class="filter-select" />
                    <el-button type="primary" @click="loadPosts" :loading="postsLoading">搜索</el-button>
                  </div>
                </div>
              </template>

              <el-table :data="posts" v-loading="postsLoading" stripe class="data-table" :row-key="row => row.id">
                <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
                <el-table-column prop="author_username" label="作者学号" min-width="120" />
                <el-table-column prop="author_nickname" label="作者昵称" min-width="120" />
                <el-table-column prop="category_name" label="分类" min-width="120" />
                <el-table-column prop="created_at" label="发布时间" min-width="180" />
                <el-table-column label="操作" width="120" fixed="right">
                  <template #default="scope">
                    <el-button size="small" type="danger" plain @click="handleDeletePost(scope.row)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </section>

          <section v-else class="table-section">
            <el-card class="panel-card" shadow="never">
              <template #header>
                <div class="panel-header">
                  <span>找回密码留言</span>
                  <div class="inline-actions">
                    <el-input v-model="resetRequestFilters.keyword" placeholder="按账号或留言关键字搜索" clearable class="search-input" />
                    <el-select v-model="resetRequestFilters.status" placeholder="处理状态" clearable class="filter-select">
                      <el-option label="待处理" value="pending" />
                      <el-option label="已处理" value="processed" />
                    </el-select>
                    <el-button type="primary" @click="loadResetRequests" :loading="resetRequestsLoading">搜索</el-button>
                  </div>
                </div>
              </template>

              <el-table :data="resetRequests" v-loading="resetRequestsLoading" stripe class="data-table" :row-key="row => row.id">
                <el-table-column prop="username" label="账号" min-width="130" />
                <el-table-column label="留言内容" min-width="260">
                  <template #default="scope">
                    <div class="request-message">{{ scope.row.message }}</div>
                  </template>
                </el-table-column>
                <el-table-column prop="created_at" label="提交时间" min-width="180" />
                <el-table-column label="状态" width="100">
                  <template #default="scope">
                    <el-tag :type="scope.row.status === 'processed' ? 'success' : 'warning'" effect="dark">
                      {{ scope.row.status === 'processed' ? '已处理' : '待处理' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="admin_note" label="处理备注" min-width="160" show-overflow-tooltip />
                <el-table-column label="操作" width="180" fixed="right">
                  <template #default="scope">
                    <div class="user-actions">
                      <el-button
                        size="small"
                        type="success"
                        plain
                        :disabled="scope.row.status === 'processed'"
                        @click="handleProcessResetRequest(scope.row)"
                      >
                        标记已处理
                      </el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </section>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const router = useRouter()
const activeSection = ref('overview')
const loading = ref(false)
const usersLoading = ref(false)
const postsLoading = ref(false)
const resetRequestsLoading = ref(false)
const currentUser = ref(JSON.parse(localStorage.getItem('user') || 'null'))

const stats = ref({
  totalUsers: 0,
  activeUsers: 0,
  bannedUsers: 0,
  adminUsers: 0,
  totalPosts: 0,
  todayPosts: 0
})

const users = ref([])
const posts = ref([])
const resetRequests = ref([])

const userFilters = reactive({
  keyword: '',
  status: ''
})

const postFilters = reactive({
  keyword: '',
  username: ''
})

const resetRequestFilters = reactive({
  keyword: '',
  status: ''
})

const sectionTitle = computed(() => {
  const mapping = {
    overview: '数据看板',
    users: '用户管理',
    posts: '内容审核',
    resetRequests: '密码申诉'
  }
  return mapping[activeSection.value] || '管理员后台'
})

const statCards = computed(() => ([
  { label: '总用户数', value: stats.value.totalUsers, hint: '平台账号总量' },
  { label: '正常用户', value: stats.value.activeUsers, hint: '当前可访问账号' },
  { label: '封禁账号', value: stats.value.bannedUsers, hint: '已限制登录账号' },
  { label: '管理员', value: stats.value.adminUsers, hint: '后台可用账号' },
  { label: '总帖子数', value: stats.value.totalPosts, hint: '全站内容库存' },
  { label: '今日新增', value: stats.value.todayPosts, hint: '当天发布内容' }
]))

const refreshCurrentUser = () => {
  try {
    currentUser.value = JSON.parse(localStorage.getItem('user') || 'null')
  } catch (error) {
    currentUser.value = null
  }
}

const loadStats = async () => {
  try {
    const res = await request.get('/api/admin/stats')
    if (res.data.code === 200) {
      stats.value = res.data.data
    }
  } catch (error) {
    handleAdminApiError(error)
  }
}

const loadUsers = async () => {
  usersLoading.value = true
  try {
    const res = await request.get('/api/admin/users', {
      params: {
        keyword: userFilters.keyword,
        status: userFilters.status
      }
    })
    if (res.data.code === 200) {
      users.value = res.data.data
    }
  } catch (error) {
    users.value = []
    handleAdminApiError(error)
  } finally {
    usersLoading.value = false
  }
}

const loadPosts = async () => {
  postsLoading.value = true
  try {
    const res = await request.get('/api/admin/posts', {
      params: {
        keyword: postFilters.keyword,
        username: postFilters.username
      }
    })
    if (res.data.code === 200) {
      posts.value = res.data.data
    }
  } catch (error) {
    posts.value = []
    handleAdminApiError(error)
  } finally {
    postsLoading.value = false
  }
}

const loadResetRequests = async () => {
  resetRequestsLoading.value = true
  try {
    const res = await request.get('/api/admin/password-reset-requests', {
      params: {
        keyword: resetRequestFilters.keyword,
        status: resetRequestFilters.status
      }
    })
    if (res.data.code === 200) {
      resetRequests.value = res.data.data
    }
  } catch (error) {
    resetRequests.value = []
    handleAdminApiError(error)
  } finally {
    resetRequestsLoading.value = false
  }
}

const handleAdminApiError = (error) => {
  const status = error?.response?.status
  if (status === 404) {
    ElMessage.error('管理员接口不存在，请重启后端服务并确认已加载最新代码')
    return
  }
  if (status === 403) {
    ElMessage.error('当前账号无管理员权限或已被封禁')
    return
  }
  if (status === 401) {
    ElMessage.error('登录状态已失效，请重新登录')
    return
  }
  ElMessage.error('管理员数据加载失败，请稍后重试')
}

const refreshAll = async () => {
  loading.value = true
  try {
    await Promise.all([loadStats(), loadUsers(), loadPosts(), loadResetRequests()])
    ElMessage.success('数据已刷新')
  } catch (error) {
    handleAdminApiError(error)
  } finally {
    loading.value = false
  }
}

const handleUserStatusToggle = async (user, enabled) => {
  const status = enabled ? 1 : 0
  try {
    await request.patch(`/api/admin/users/${user.id}/status`, { status })
    ElMessage.success(status === 1 ? '用户已解封' : '用户已封禁')
    await Promise.all([loadUsers(), loadStats()])
  } catch (error) {
    await loadUsers()
  }
}

const toggleUserStatusQuick = async (user) => {
  const nextStatus = Number(user.status) === 1 ? 0 : 1
  await handleUserStatusToggle(user, nextStatus === 1)
}

const handleResetUserPassword = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确认将用户 ${user.username} 的密码重置为默认密码 123456 吗？`,
      '重置密码确认',
      {
        type: 'warning',
        confirmButtonText: '确认重置',
        cancelButtonText: '取消'
      }
    )

    const res = await request.post(`/api/admin/users/${user.id}/reset-password`)
    if (res.data.code === 200) {
      ElMessage.success(`已重置 ${user.username} 的密码为 123456`)
    } else {
      ElMessage.error(res.data.message || '重置密码失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.response?.data?.message || '重置密码失败')
    }
  }
}

const handleDeletePost = async (post) => {
  try {
    await ElMessageBox.confirm(
      `确认删除帖子《${post.title}》吗？此操作会连同评论和点赞一起清除。`,
      '违规删除',
      {
        type: 'warning',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消'
      }
    )
    await request.delete(`/api/posts/${post.id}`)
    ElMessage.success('帖子已删除')
    await Promise.all([loadPosts(), loadStats()])
  } catch (error) {
    if (error !== 'cancel') {
      await loadPosts()
    }
  }
}

const handleProcessResetRequest = async (requestItem) => {
  try {
    await ElMessageBox.confirm(
      `确认已处理账号 ${requestItem.username} 的找回密码请求吗？`,
      '处理确认',
      {
        type: 'warning',
        confirmButtonText: '确认',
        cancelButtonText: '取消'
      }
    )

    const res = await request.patch(`/api/admin/password-reset-requests/${requestItem.id}`, {
      status: 'processed',
      adminNote: '管理员已重置密码为默认值 123456'
    })

    if (res.data.code === 200) {
      ElMessage.success('已标记为已处理')
      await loadResetRequests()
    } else {
      ElMessage.error(res.data.message || '更新处理状态失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.response?.data?.message || '更新处理状态失败')
    }
  }
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

onMounted(async () => {
  refreshCurrentUser()
  try {
    await refreshAll()
  } catch (error) {
    handleAdminApiError(error)
  }
})
</script>

<style scoped>
.admin-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(255, 196, 87, 0.18), transparent 34%),
    radial-gradient(circle at right 20%, rgba(59, 130, 246, 0.18), transparent 28%),
    linear-gradient(135deg, #09111f 0%, #0d1728 45%, #111b2e 100%);
  color: #e5eefc;
}

.ambient {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  pointer-events: none;
}

.ambient-one {
  width: 280px;
  height: 280px;
  background: rgba(56, 189, 248, 0.18);
  top: -100px;
  right: 5%;
}

.ambient-two {
  width: 320px;
  height: 320px;
  background: rgba(251, 191, 36, 0.14);
  bottom: -120px;
  left: -80px;
}

.admin-shell {
  position: relative;
  z-index: 1;
  min-height: 100vh;
}

.admin-aside {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 28px 18px 22px;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(4, 10, 20, 0.55);
  backdrop-filter: blur(18px);
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}

.brand-mark {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 800;
  color: #09111f;
  background: linear-gradient(135deg, #fbbf24, #fde68a);
  box-shadow: 0 12px 30px rgba(251, 191, 36, 0.3);
}

.brand-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.4px;
}

.brand-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(229, 238, 252, 0.55);
}

.admin-menu {
  border-right: none;
}

.admin-menu :deep(.el-menu-item) {
  margin: 8px 0;
  border-radius: 14px;
  height: 48px;
  transition: all 0.25s ease;
}

.admin-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.35), rgba(59, 130, 246, 0.15));
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.aside-footer {
  display: grid;
  gap: 14px;
  margin-top: 20px;
}

.assistant-card {
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.assistant-label {
  font-size: 12px;
  color: rgba(229, 238, 252, 0.55);
}

.assistant-name {
  margin: 8px 0 12px;
  font-size: 16px;
  font-weight: 700;
}

.home-btn {
  width: 100%;
  border-radius: 14px;
}

.admin-main-wrap {
  min-width: 0;
}

.admin-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: auto;
  padding: 28px 34px 0;
  color: #f5f9ff;
}

.page-kicker {
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(229, 238, 252, 0.45);
}

.page-title {
  margin: 6px 0 0;
  font-size: 30px;
  line-height: 1.15;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-main {
  padding: 22px 34px 34px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.stat-card,
.panel-card {
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  background: rgba(11, 18, 33, 0.72) !important;
  backdrop-filter: blur(16px);
  color: #f2f7ff;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.22);
  border-radius: 22px;
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
}

.stat-label {
  font-size: 13px;
  color: rgba(229, 238, 252, 0.64);
}

.stat-value {
  margin-top: 14px;
  font-size: 34px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.stat-hint {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(229, 238, 252, 0.48);
}

.panel-card :deep(.el-card__header) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  font-size: 16px;
  font-weight: 700;
}

.inline-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search-input,
.filter-select {
  width: 220px;
}

.overview-note {
  color: rgba(229, 238, 252, 0.72);
  line-height: 1.8;
}

.data-table {
  --el-table-border-color: rgba(255, 255, 255, 0.08);
  --el-table-border: 1px solid rgba(255, 255, 255, 0.08);
  --el-table-header-bg-color: rgba(255, 255, 255, 0.04);
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(59, 130, 246, 0.08);
  --el-table-text-color: #edf4ff;
  --el-table-header-text-color: rgba(229, 238, 252, 0.75);
}

.user-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.request-message {
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

:deep(.el-table),
:deep(.el-table__inner-wrapper),
:deep(.el-table__body-wrapper),
:deep(.el-table th),
:deep(.el-table td) {
  background-color: transparent !important;
}

:deep(.el-switch__core) {
  min-width: 48px;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 920px) {
  .admin-shell {
    display: block;
  }

  .admin-aside {
    width: auto !important;
  }

  .admin-topbar,
  .admin-main {
    padding-left: 18px;
    padding-right: 18px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .panel-header,
  .topbar-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }
}
</style>
