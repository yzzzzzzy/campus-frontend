<template>
  <div class="common-layout">
    <el-container>
      <NavBar 
        ref="navBarRef"
        title="🎓 校园信息共享平台" 
        bgColor="#409EFF"
        @show-announcement-detail="handleShowAnnouncementDetail"
      />
      <el-main class="main-content">
        <div class="hero-banner">
          <div class="banner-content">
            <h1 class="banner-title">打破信息壁垒，规划理想未来</h1>
            <p class="banner-subtitle">专注于大学生的升学、竞赛、就业与高质量互助</p>
            <div class="hero-actions">
              <el-button type="primary" size="large" class="explore-btn" @click="router.push('/forum')" round>
                立即探索社区
              </el-button>
              <el-button
                v-if="isAdmin"
                type="warning"
                size="large"
                class="admin-entry-btn"
                @click="router.push('/admin')"
                round
              >
                进入管理后台
              </el-button>
            </div>
          </div>
        </div>

        <div class="nav-grid">
          <el-row :gutter="30" justify="center">
            <el-col :md="8" :sm="12" :xs="24" class="nav-col">
              <div class="card-wrapper" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave" @click="router.push('/study')">
                <el-card class="nav-card" shadow="never">
                  <div class="icon-wrapper" style="background: rgba(64, 158, 255, 0.1); color: #409EFF;">
                    <el-icon><Reading /></el-icon>
                  </div>
                  <h3>升学考公资料</h3>
                  <p>历年真题 / 备考经验 / 院校资讯</p>
                </el-card>
              </div>
            </el-col>
            <el-col :md="8" :sm="12" :xs="24" class="nav-col">
              <div class="card-wrapper" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave" @click="router.push('/skills')">
                <el-card class="nav-card" shadow="never">
                  <div class="icon-wrapper" style="background: rgba(156, 39, 176, 0.1); color: #9C27B0;">
                    <el-icon><Monitor /></el-icon>
                  </div>
                  <h3 style="color: #9C27B0;">个人提升资源</h3>
                  <p>编程开发 / 剪辑修图 / 办公效率</p>
                </el-card>
              </div>
            </el-col>
            <el-col :md="8" :sm="12" :xs="24" class="nav-col">
              <div class="card-wrapper" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave" @click="router.push('/competition')">
                <el-card class="nav-card" shadow="never">
                  <div class="icon-wrapper" style="background: rgba(103, 194, 58, 0.1); color: #67C23A;">
                    <el-icon><Trophy /></el-icon>
                  </div>
                  <h3>竞赛组队大厅</h3>
                  <p>赛事日历 / 跨专业寻找神仙队友</p>
                </el-card>
              </div>
            </el-col>
          </el-row>

          <el-row :gutter="30" justify="center" style="margin-top: 10px;">
            <el-col :md="8" :sm="12" :xs="24" class="nav-col">
              <div class="card-wrapper" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave" @click="router.push('/career')">
                <el-card class="nav-card" shadow="never">
                  <div class="icon-wrapper" style="background: rgba(230, 162, 60, 0.1); color: #E6A23C;">
                    <el-icon><Briefcase /></el-icon>
                  </div>
                  <h3>实习与就业面经</h3>
                  <p>校招内推 / 大厂面经 / 简历辅导</p>
                </el-card>
              </div>
            </el-col>
            <el-col :md="8" :sm="12" :xs="24" class="nav-col">
              <div class="card-wrapper" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave" @click="router.push('/forum')">
                <el-card class="nav-card" shadow="never">
                  <div class="icon-wrapper" style="background: rgba(245, 108, 108, 0.1); color: #F56C6C;">
                    <el-icon><ChatDotRound /></el-icon>
                  </div>
                  <h3>校园综合论坛</h3>
                  <p>二手交易 / 失物招领 / 互助问答</p>
                </el-card>
              </div>
            </el-col>
          </el-row>
        </div>

        <div class="section-header">
          <h2>🌟 平台最新资讯</h2>
          <p class="section-subtitle">持续汇聚校园最热话题</p>
          <el-divider />
        </div>

        <div class="feed-section">
          <el-tabs v-model="activeFeedTab">
            <el-tab-pane label="📰 最新资讯" name="latest">
              <div class="feed-content">
                <!-- 加载状态 -->
                <div v-if="latestLoading && latestList.length === 0" class="loading-state">
                  <el-skeleton :rows="5" animated />
                </div>
                
                <!-- 资源列表 -->
                  <div v-else-if="latestList.length > 0" class="feed-list">
                  <div 
                    v-for="item in latestList" 
                    :key="`latest-${item.id}`"
                    class="feed-card"
                    @click="navigateToFeedItem(item)">
                    <div class="card-header">
                      <div class="card-tags">
                        <el-tag>{{ item.category }}</el-tag>
                        <el-tag type="info" effect="plain">{{ item.source_name || '最新资讯' }}</el-tag>
                      </div>
                      <span class="time">{{ formatTime(item.created_at) }}</span>
                    </div>
                    <h3 class="card-title">{{ item.title }}</h3>
                    <p class="card-excerpt">{{ truncateText(item.content, 80) }}</p>
                    <div class="card-footer">
                      <span class="author">{{ item.author_name || '匿名用户' }}</span>
                    </div>
                  </div>

                  <!-- 加载更多按钮 -->
                  <div class="load-more-container">
                    <el-button 
                      v-if="latestHasMore"
                      @click="loadMoreLatest"
                      :loading="latestLoading"
                      type="primary"
                      plain>
                      加载更多
                    </el-button>
                      <p v-else class="no-more">已加载全部资讯</p>
                  </div>
                </div>

                <!-- 空状态 -->
                  <el-empty v-else description="暂无资讯" :image-size="100" />
              </div>
            </el-tab-pane>

            <el-tab-pane label="🔥 热门帖子" name="trending">
              <div class="feed-content">
                <!-- 加载状态 -->
                <div v-if="trendingLoading" class="loading-state">
                  <el-skeleton :rows="5" animated />
                </div>

                <!-- 帖子列表 -->
                <div v-else-if="trendingList.length > 0" class="feed-list">
                  <div 
                    v-for="(item, index) in trendingList"
                    :key="`trending-${item.id}`"
                    class="feed-card trending-card"
                    @click="navigateToPost(item)">
                    <div class="ranking-badge">{{ index + 1 }}</div>
                    <div class="card-header">
                      <el-tag type="danger">{{ item.category_name || '其他' }}</el-tag>
                      <span class="time">{{ formatTime(item.created_at) }}</span>
                    </div>
                    <h3 class="card-title">{{ item.title }}</h3>
                    <p class="card-excerpt">{{ truncateText(item.content, 80) }}</p>
                    <div class="card-stats">
                      <span>
                        <el-icon><Pointer /></el-icon>
                        {{ item.like_count }}
                      </span>
                      <span>
                        <el-icon><ChatDotRound /></el-icon>
                        {{ item.comment_count }}
                      </span>
                      <span>
                        <el-icon><Star /></el-icon>
                        {{ item.favorite_count }}
                      </span>
                    </div>
                    <div class="card-footer">
                      <span class="author">{{ item.author_name || '匿名用户' }}</span>
                    </div>
                  </div>
                </div>

                <!-- 空状态 -->
                <el-empty v-else description="暂无热门帖子" :image-size="100" />
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-main>
    </el-container>

    <!-- 公告详情 Dialog - 使用 Teleport 挂载到 body，避免层级问题 -->
    <teleport to="body">
      <el-dialog
        v-model="detailDialogVisible"
        title="公告详情"
        width="680px"
        align-center
        :close-on-click-modal="false"
      >
        <div v-if="detailLoading" class="detail-loading">
          <el-skeleton :rows="5" animated />
        </div>
        <div v-else-if="currentAnnouncement?.id" class="announcement-detail-content">
          <div class="detail-header">
            <div class="detail-title">{{ currentAnnouncement.title }}</div>
            <div class="detail-tags">
              <el-tag v-if="currentAnnouncement.is_pinned" type="danger" effect="dark">置顶</el-tag>
            </div>
          </div>
          <div class="detail-meta">
            <span>发布时间：{{ formatDetailTime(currentAnnouncement.created_at) }}</span>
            <span v-if="currentAnnouncement.updated_at && currentAnnouncement.updated_at !== currentAnnouncement.created_at">
              最后更新：{{ formatDetailTime(currentAnnouncement.updated_at) }}
            </span>
          </div>
          <div class="detail-body">{{ currentAnnouncement.content }}</div>
        </div>
        <el-empty v-else description="加载中或公告不存在..." :image-size="80" />

        <template #footer>
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </template>
      </el-dialog>
    </teleport>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import NavBar from '../components/NavBar.vue'
import { getStoredUser, parseJwtPayload } from '../utils/auth'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const navBarRef = ref(null)

// 导入图标
import { Pointer, ChatDotRound, Star } from '@element-plus/icons-vue'


// 👉 [新增] 信息流相关状态
const activeFeedTab = ref('latest')
const latestList = ref([])
const latestPage = ref(1)
const latestTotal = ref(0)
const latestLoading = ref(true)
const trendingList = ref([])
const trendingLoading = ref(true)

// 计算是否还有更多最新资源
const latestHasMore = computed(() => {
  return latestList.value.length < latestTotal.value
})
// 公告详情相关状态
const detailDialogVisible = ref(false)
const detailLoading = ref(false)
const currentAnnouncement = ref({
  id: null,
  title: '',
  content: '',
  is_pinned: 0,
  created_at: '',
  updated_at: ''
})

const isAdmin = computed(() => {
  const user = getStoredUser()
  const tokenPayload = parseJwtPayload(localStorage.getItem('token'))
  return Number(user?.role ?? tokenPayload?.role) === 1
})

// 加载公告详情
const loadAnnouncementDetail = async (announcementId) => {
  detailLoading.value = true
  try {
    const res = await request.get(`/api/announcements/${announcementId}`)
    if (res.data.code === 200 && res.data.data) {
      currentAnnouncement.value = res.data.data
      // 逐条标记已读（只标记当前这一条）
      await request.put(`/api/announcements/${announcementId}/read`)
    } else {
      ElMessage.error('公告加载失败')
    }
  } catch (error) {
    console.error('加载公告详情失败:', error)
    ElMessage.error('公告加载失败: ' + (error?.message || '未知错误'))
  } finally {
    detailLoading.value = false
  }
}

// 格式化时间
const formatDetailTime = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleString('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 处理 NavBar 发出的显示公告详情事件
const handleShowAnnouncementDetail = async (announcementId) => {
  detailDialogVisible.value = true
  await loadAnnouncementDetail(announcementId)
}

// 监听 Dialog 关闭，刷新 NavBar 的公告红点
watch(detailDialogVisible, (newVal) => {
  if (!newVal && navBarRef.value) {
    navBarRef.value.loadAnnouncements()
  }
})

// 🎮 核心炫技：计算 3D 偏转角度
const handleMouseMove = (e) => {
  const card = e.currentTarget
  // 获取卡片在屏幕中的边界和位置
  const rect = card.getBoundingClientRect()
  
  // 计算鼠标在卡片内部的相对坐标 (0 到 1 之间)
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  // 计算中心点
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  
  // 计算旋转角度 (最大倾斜 15 度)
  // 当鼠标在右边，绕 Y 轴正向旋转；鼠标在下边，绕 X 轴负向旋转
  const rotateX = ((y - centerY) / centerY) * -15
  const rotateY = ((x - centerX) / centerX) * 15

  // 应用 CSS Transform，使用 perspective 创建 3D 镜头感
  card.style.transition = 'transform 0.1s ease-out, box-shadow 0.1s ease-out'
  card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`
  // 动态阴影：鼠标往哪边移，阴影往反方向投射
  card.style.boxShadow = `${-rotateY}px ${rotateX}px 30px rgba(0,0,0,0.1)`
}

// 鼠标离开时，平滑复原
const handleMouseLeave = (e) => {
  const card = e.currentTarget
  card.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.5s ease'
  card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`
  card.style.boxShadow = `0 10px 20px rgba(0,0,0,0.03)`
}

// 👉 [新增] 加载最新资讯
const loadLatest = async () => {
  latestLoading.value = true
  try {
    const res = await request.get('/api/feed/latest', {
      params: { page: latestPage.value }
    })
    if (res.data.code === 200) {
      if (latestPage.value === 1) {
        latestList.value = res.data.data
      } else {
        latestList.value.push(...res.data.data)
      }
      latestTotal.value = res.data.total
    }
  } catch (error) {
    console.error('加载最新资讯失败:', error)
  } finally {
    latestLoading.value = false
  }
}

// 👉 [新增] 加载更多最新资讯
const loadMoreLatest = async () => {
  latestPage.value++
  await loadLatest()
}

// 👉 [新增] 加载热门帖子
const loadTrending = async () => {
  trendingLoading.value = true
  try {
    const res = await request.get('/api/feed/trending')
    if (res.data.code === 200) {
      trendingList.value = res.data.data
    }
  } catch (error) {
    console.error('加载热门帖子失败:', error)
  } finally {
    trendingLoading.value = false
  }
}

// 👉 [新增] 格式化时间（相对时间）
const formatTime = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  
  if (diffSec < 60) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`
  if (diffHour < 24) return `${diffHour}小时前`
  if (diffDay < 30) return `${diffDay}天前`
  
  return date.toLocaleDateString('zh-CN')
}

// 👉 [新增] 截断文本
const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

// 👉 [新增] 导航到信息流来源页面
const navigateToFeedItem = (item) => {
  if (item.feed_type === 'study') {
    router.push(`/study?materialId=${item.id}`)
    return
  }

  if (item.feed_type === 'resource') {
    router.push(`/skills?resourceId=${item.id}`)
    return
  }

  if (item.feed_type === 'career') {
    router.push(`/career?careerId=${item.id}`)
    return
  }

  if (item.feed_type === 'competition') {
    router.push(`/competition?compId=${item.id}`)
    return
  }

  router.push('/home')
}
// 👉 [新增] 导航到帖子详情
const navigateToPost = (item) => {
  router.push(`/forum?postId=${item.id}`)
}

// 👉 [新增] 页面初始化时加载信息流
import { onMounted } from 'vue'
onMounted(async () => {
  await loadLatest()
  await loadTrending()
})

// 👉 [新增] 监听路由变化，每次进入首页都刷新数据（解决登录后缓存问题）
watch(() => route.path, async (newPath) => {
  if (newPath === '/home') {
    // 重置分页和数据
    latestPage.value = 1
    latestList.value = []
    latestTotal.value = 0
    trendingList.value = []
    // 重新拉取数据
    await loadLatest()
    await loadTrending()
  }
}, { immediate: false })
</script>

<style scoped>
.main-content { 
  background-color: #fafbfc; /* 更干净的背景色 */
  min-height: calc(100vh - 60px); 
  padding: 30px 10%; 
}

/* 公告详情 Dialog 样式 */
.announcement-detail-content {
  display: grid;
  gap: var(--gap-lg);
}

.detail-header {
  display: grid;
  gap: var(--gap-md);
}

.detail-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.35;
  word-break: break-word;
}

.detail-tags {
  display: flex;
  gap: var(--gap-sm);
  flex-wrap: wrap;
}

.detail-meta {
  display: flex;
  justify-content: space-between;
  gap: var(--gap-md);
  flex-wrap: wrap;
  font-size: 13px;
  color: var(--color-text-tertiary);
}

.detail-body {
  padding: var(--gap-lg);
  border-radius: var(--radius-lg);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  font-size: 15px;
  line-height: 1.8;
  color: var(--color-text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 400px;
  overflow-y: auto;
}

/* 🌈 升级版 Banner */
.hero-banner { 
  position: relative;
  
  /* 👉 [核心修复] 把波点网格和蓝色渐变像三明治一样叠在一起，用逗号隔开 */
  background: 
    radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px),
    linear-gradient(135deg, #409EFF 0%, #60a5fa 100%);
  background-size: 20px 20px, 100% 100%;
  
  border-radius: 24px; 
  padding: 60px 20px; 
  text-align: center; 
  color: white; 
  margin-bottom: 50px; 
  box-shadow: 0 20px 40px rgba(64, 158, 255, 0.2); 
  overflow: hidden;
}

.banner-content {
  position: relative;
  z-index: 2;
}

.banner-title { 
  font-size: 38px; 
  margin: 0 0 15px 0; 
  font-weight: 800; 
  letter-spacing: 3px; 
  text-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.banner-subtitle { 
  font-size: 18px; 
  margin: 0 0 25px 0; 
  opacity: 0.9; 
  font-weight: 300;
}

.explore-btn {
  font-size: 16px;
  font-weight: bold;
  padding: 12px 30px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
  transition: all 0.3s;
}

.hero-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.admin-entry-btn {
  font-size: 16px;
  font-weight: bold;
  padding: 12px 24px;
  box-shadow: 0 8px 20px rgba(230, 162, 60, 0.25);
}

.explore-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(0,0,0,0.2);
}

.admin-entry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(230, 162, 60, 0.35);
}

/* 🚀 3D 卡片外层容器 */
.card-wrapper {
  cursor: pointer;
  perspective: 1000px; /* 开启 3D 舞台 */
  transform-style: preserve-3d;
  margin-bottom: 20px;
  border-radius: 20px;
  /* 初始阴影 */
  box-shadow: 0 10px 20px rgba(0,0,0,0.03); 
}

.nav-card { 
  text-align: center; 
  height: 100%; 
  border: none; 
  border-radius: 20px;
  padding: 20px 10px;
  background: white;
  pointer-events: none; /* 让鼠标事件直接穿透到外层的 wrapper 上，防止抖动 */
}

/* 图标包裹器，增加呼吸感 */
.icon-wrapper {
  width: 70px;
  height: 70px;
  margin: 0 auto 20px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 32px;
  transition: all 0.3s;
}

.card-wrapper:hover .icon-wrapper {
  transform: scale(1.1); /* 鼠标移入时，不仅卡片动，内部图标也微微放大 */
}

.nav-card h3 { 
  margin: 0 0 10px 0; 
  font-size: 20px; 
  color: #1e293b; 
  font-weight: 700;
}

.nav-card p { 
  font-size: 13px; 
  color: #64748b; 
  margin: 0; 
  line-height: 1.5;
}

.section-header { 
  margin-top: 50px;
  text-align: center; 
}

.section-header h2 { 
  margin: 0; 
  font-size: 24px; 
  color: #1e293b; 
  font-weight: bold;
}

.section-subtitle {
  color: #94a3b8;
  font-size: 14px;
  margin-top: 8px;
}

@media (max-width: 768px) {
  .main-content {
    padding: 14px 12px;
  }

  .hero-banner {
    border-radius: 16px;
    padding: 34px 14px;
    margin-bottom: 24px;
  }

  .banner-title {
    font-size: 26px;
    letter-spacing: 1px;
  }

  .banner-subtitle {
    font-size: 15px;
    margin-bottom: 18px;
  }

  .explore-btn,
  .admin-entry-btn {
    width: 100%;
    max-width: 280px;
  }

  .section-header {
    margin-top: 24px;
  }

  .section-header h2 {
    font-size: 20px;
  }

  .nav-card h3 {
    font-size: 18px;
  }
}
  /* 信息流样式 */
  .feed-section {
    margin-top: 30px;
    padding: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }

  .feed-content {
    padding: 20px 0;
  }

  .loading-state {
    padding: 20px;
  }

  .feed-list {
    display: grid;
    gap: 16px;
  }

  .feed-card {
    padding: 16px;
    border: 1px solid #e8e8e8;
    border-radius: 10px;
    background: #fafbfc;
    cursor: pointer;
    transition: all 0.3s;
  }

  .feed-card:hover {
    border-color: #409EFF;
    background: white;
    box-shadow: 0 4px 16px rgba(64, 158, 255, 0.12);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
    font-size: 12px;
  }

  .card-tags {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .time {
    color: #999;
    white-space: nowrap;
  }

  .card-title {
    margin: 0 0 10px 0;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    line-height: 1.4;
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-excerpt {
    margin: 0 0 12px 0;
    font-size: 13px;
    color: #666;
    line-height: 1.6;
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-stats {
    display: flex;
    gap: 20px;
    margin-bottom: 10px;
    font-size: 12px;
    color: #999;
  }

  .card-stats span {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: #999;
  }

  .author {
    color: #666;
  }

  .ranking-badge {
    display: inline-block;
    width: 28px;
    height: 28px;
    line-height: 28px;
    text-align: center;
    border-radius: 50%;
    background: linear-gradient(135deg, #FF6B6B, #FF8E72);
    color: white;
    font-weight: bold;
    font-size: 13px;
    margin-bottom: 10px;
  }

  .trending-card {
    position: relative;
  }

  .load-more-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    margin-top: 30px;
    padding: 20px 0;
  }

  .no-more {
    text-align: center;
    color: #999;
    font-size: 13px;
    margin: 0;
  }

  @media (max-width: 768px) {
    .feed-section {
      margin-top: 20px;
      padding: 12px;
    }

    .feed-content {
      padding: 12px 0;
    }

    .feed-card {
      padding: 12px;
    }

    .card-title {
      font-size: 15px;
    }

    .card-excerpt {
      font-size: 12px;
    }
  }
</style>