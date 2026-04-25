<template>
  <div class="common-layout">
    <el-container>
      <NavBar title="🚀 个人提升资料库" bgColor="#9C27B0">
        <el-button @click="router.push('/home')" icon="Back">返回主页</el-button>
      </NavBar>
      

      <el-main class="main-content">
        <div class="filter-container unified-tabs-shell" style="--tabs-accent: #9C27B0;">
          <el-tabs v-model="activeType" class="category-tabs unified-tabs" @tab-change="handleFilterChange">
            <el-tab-pane label="全部资源" name=""></el-tab-pane>
            <el-tab-pane label="💻 编程开发" name="编程开发"></el-tab-pane>
            <el-tab-pane label="🎨 创意设计" name="创意设计"></el-tab-pane>
            <el-tab-pane label="📊 办公效率" name="办公效率"></el-tab-pane>
          </el-tabs>

          <div style="display: flex; align-items: center;">
            <el-input 
              v-model="searchQuery" 
              placeholder="搜索技能提升资源..." 
              prefix-icon="Search"
              clearable
              @clear="handleFilterChange"
              @keyup.enter="handleFilterChange"
              style="width: 250px;"
            />
          </div>
        </div>

        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" v-for="item in resourceList" :key="item.id" class="resource-col">
            <el-card shadow="hover" class="resource-card">
              <template #header>
                <div class="card-header">
                  <span class="resource-title">{{ item.title }}</span>
                  <el-tag type="info" size="small">{{ item.type }}</el-tag>
                </div>
              </template>
              <div class="resource-body">
                <p class="resource-desc">{{ item.description }}</p>
                <div class="resource-meta">
                  <span class="meta-item">大小: {{ item.file_size }}</span>
                  <span class="meta-item">格式: {{ item.file_format }}</span>
                </div>
              </div>
              <div class="resource-footer">
                <div style="display: flex; align-items: center;">
                  <el-tooltip :content="item.is_favorited ? '取消收藏' : '加入收藏'" placement="top">
                    <el-button 
                      :type="item.is_favorited ? 'warning' : 'info'" 
                      link 
                      :icon="item.is_favorited ? 'StarFilled' : 'Star'" 
                      @click="handleFavorite(item)" 
                      style="font-size: 20px; margin-right: 15px;" 
                    />
                  </el-tooltip>
                </div>
                <el-button type="primary" plain size="small" @click="handleDownload(item.download_url)">
                  获取资源
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-empty v-if="resourceList.length === 0" description="暂无该分类资源" />

        <div class="pagination-container" v-if="totalItems > 0">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[5, 10, 20, 50]"
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="totalItems"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import request from '../utils/request'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import NavBar from '../components/NavBar.vue'

const router = useRouter()
const activeType = ref('') // 当前选中的分类，空字符串代表全部
const searchQuery = ref('') // 👉 [新增] 声明搜索框绑定的变量
const resourceList = ref([])
const myFavoriteIds = ref([])
const isPageActive = ref(true)
// 👉 [新增] 1. 分页核心变量
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)

// 👉 [新增] 2. 统筹控制器（切换分类或搜索时归零）
const handleFilterChange = () => {
  currentPage.value = 1
  fetchResources()
}

// 👉 [新增] 3. 分页器触发的方法
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  fetchResources()
}
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchResources()
}

const syncFavoriteIds = (targetId, shouldInclude) => {
  const ids = new Set(myFavoriteIds.value)
  if (shouldInclude) {
    ids.add(targetId)
  } else {
    ids.delete(targetId)
  }
  myFavoriteIds.value = Array.from(ids)
}

// 获取当前用户在该模块的收藏 ID 列表
const fetchMyFavorites = async () => {
  try {
    const res = await request.get('/api/user/favorites', { params: { type: 'resource' } })
    if (!isPageActive.value) return
    if (res.data.code === 200) myFavoriteIds.value = res.data.data.map(item => item.id)
  } catch (error) { }
}

// 获取资源列表的方法，支持传入分类参数
const fetchResources = async () => {
  try {
    const res = await request.get('/api/resources', { 
      params: { 
        type: activeType.value,
        keyword: searchQuery.value,
        page: currentPage.value,
        limit: pageSize.value
      } 
    })
    
    if (!isPageActive.value) return
    if (res.data.code === 200) {
      resourceList.value = res.data.data.map(item => ({
        ...item,
        is_favorited: myFavoriteIds.value.includes(item.id)
      }))
      totalItems.value = res.data.total || 0 // 拿到后端算好的总数
    }
  } catch (error) { ElMessage.error('获取资源列表失败') }
}

// 点击前往学习，在新窗口打开链接
const goToLearn = (url) => {
  window.open(url, '_blank')
}

// 根据不同类型返回不同的标签颜色
const getTagType = (type) => {
  const colorMap = {
    '编程开发': 'primary',
    '创意设计': 'warning',
    '办公效率': 'success'
  }
  return colorMap[type] || 'info'
}
const handleFavorite = async (item) => {
  try {
    const res = await request.post('/api/favorites/toggle', {
      target_id: item.id,
      target_type: 'resource' // 这里的 type 要和后端对应
    })
    if (!isPageActive.value) return
    if (res.data.code === 200) {
      ElMessage.success(res.data.message)
      const nextFavorited = !item.is_favorited
      item.is_favorited = nextFavorited
      syncFavoriteIds(item.id, nextFavorited)
    }
  } catch (error) { ElMessage.error('操作失败') }
}

// 页面加载时默认获取全部资源
onMounted(async () => {
  await fetchMyFavorites()
  await fetchResources()
})

onUnmounted(() => {
  isPageActive.value = false
})
</script>

<style scoped>
.header {
  background-color: #9C27B0; /* 呼应主页紫色的模块主题 */
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
.main-content {
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
  padding: 20px 10%;
}

.resource-col {
  margin-bottom: 20px;
}
.resource-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}
.resource-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  line-height: 1.4;
}
.resource-body {
  flex-grow: 1; /* 让描述部分自动撑开，把底部按钮顶下去 */
}
.resource-desc {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin: 10px 0;
}
.resource-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  border-top: 1px dashed #ebeef5;
  padding-top: 15px;
}
.time-text {
  font-size: 12px;
  color: #909399;
}

@media (max-width: 768px) {
  .main-content {
    padding: 14px 12px;
  }

  .card-header {
    flex-wrap: wrap;
  }

  .resource-footer {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>