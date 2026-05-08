<template>
  <div class="common-layout">
    <el-container>
      <NavBar title="📚 升学考公资料库" bgColor="#409EFF">
        <el-button @click="router.push('/home')" icon="Back">返回主页</el-button>
      </NavBar>
      

      <el-main class="main-content">
        <div class="filter-container">
          <el-tabs v-model="activeCategory" class="category-tabs" @tab-change="handleFilterChange">
            <el-tab-pane label="全部资料" name=""></el-tab-pane>
            <el-tab-pane label="📚 考研资料" name="考研资料"></el-tab-pane>
            <el-tab-pane label="💼 考公资料" name="考公资料"></el-tab-pane>
            <el-tab-pane label="💯 四六级" name="四六级"></el-tab-pane>
          </el-tabs>
          
          <div style="display: flex; align-items: center;">
            <el-input 
              v-model="searchQuery" 
              placeholder="搜索考研/公考资料..." 
              prefix-icon="Search"
              clearable
              @clear="handleFilterChange"      @keyup.enter="handleFilterChange" style="width: 250px;"
            />
          </div>
        </div>

        <el-card shadow="hover" class="list-card">
          <el-empty v-if="studyList.length === 0" description="暂无该分类资料" />
          
          <div v-for="item in studyList" :key="item.id" class="material-item">
            <div class="material-info">
              <div class="title-row">
                <el-tag :type="item.file_type === 'PDF' ? 'danger' : 'primary'" size="small" class="file-tag">
                  {{ item.file_type }}
                </el-tag>
                <span class="material-title">{{ item.title }}</span>
                <el-tag type="success" size="small" effect="plain" style="margin-left: 10px;">
                  {{ item.category }}
                </el-tag>
              </div>
              <p class="material-desc">{{ item.description }}</p>
              <div class="material-meta">收录时间: {{ new Date(item.created_at).toLocaleDateString() }}</div>
            </div>
            
            <div class="material-action">
              <el-tooltip :content="item.is_favorited ? '取消收藏' : '加入收藏'" placement="top">
                <el-button 
                  :type="item.is_favorited ? 'warning' : 'info'" 
                  link 
                  :icon="item.is_favorited ? 'StarFilled' : 'Star'" 
                  @click="handleFavorite(item)" 
                  style="font-size: 22px; margin-right: 15px;" 
                />
              </el-tooltip>
              
              <el-button type="primary" icon="Download" @click="handleDownload(item.download_url)">
                获取资料
              </el-button>
            </div>
          </div>
          
        </el-card>
        <PaginationBar
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="totalItems"
          @current-change="handleCurrentChange"
          @size-change="handleSizeChange"
        />

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
import PaginationBar from '../components/PaginationBar.vue'
import { usePagination } from '../utils/composables/usePagination'
import { useFavorites } from '../utils/composables/useFavorites'

const router = useRouter()
const activeCategory = ref('')
const searchQuery = ref('')
const studyList = ref([])
const isPageActive = ref(true)

const { currentPage, pageSize, totalItems, handleFilterChange, handleSizeChange, handleCurrentChange } = usePagination(() => fetchStudyMaterials())
const { myFavoriteIds, fetchMyFavorites, handleFavorite } = useFavorites('study')
const fetchStudyMaterials = async () => {
  try {
    // 👉 [修改] 加入 page 和 limit 参数发送给后端
    const res = await request.get('/api/study', { 
      params: { 
        category: activeCategory.value, 
        keyword: searchQuery.value,
        page: currentPage.value,
        limit: pageSize.value
      } 
    })
    
    if (!isPageActive.value) return
    if (res.data.code === 200) {
      studyList.value = res.data.data.map(item => ({
        ...item,
        is_favorited: myFavoriteIds.value.includes(item.id)
      }))
      // 👉 [新增] 接收后端返回的总条数
      totalItems.value = res.data.total || 0
    }
  } catch (error) { ElMessage.error('获取资料列表失败') }
}

const handleDownload = (url) => {
  ElMessage.success('正在为您跳转到下载页面...')
  setTimeout(() => {
    window.open(url, '_blank')
  }, 800)
}

onMounted(async () => {
  await fetchMyFavorites()
  await fetchStudyMaterials()
})

onUnmounted(() => {
  isPageActive.value = false
})
</script>

<style scoped>
.header {
  background-color: #409EFF; /* 学术蓝 */
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
.main-content {
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
  padding: 20px 15%; /* 列表模式两边留白多一点更好看 */
}

.list-card {
  border-radius: 8px;
}
.material-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #ebeef5;
}
.material-item:last-child {
  border-bottom: none;
}
.material-info {
  flex: 1;
}
.title-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.file-tag {
  margin-right: 10px;
  font-weight: bold;
}
.material-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}
.material-desc {
  font-size: 14px;
  color: #606266;
  margin: 0 0 10px 0;
}
.material-meta {
  font-size: 12px;
  color: #909399;
}
.material-action {
  margin-left: 20px;
}

@media (max-width: 768px) {
  .main-content {
    padding: 14px 12px;
  }

  .material-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 0;
  }

  .title-row {
    flex-wrap: wrap;
    gap: 6px;
  }

  .material-action {
    margin-left: 0;
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }

  :deep(.el-dialog) {
    width: min(92vw, 720px) !important;
  }
}
</style>