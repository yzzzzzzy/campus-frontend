<template>
  <div class="common-layout">
    <el-container>
      <NavBar title="📚 升学考公资料库" bgColor="#409EFF">
        <el-button @click="router.push('/home')" icon="Back">返回主页</el-button>
      </NavBar>
      

      <el-main class="main-content">
        <el-tabs v-model="activeCategory" class="category-tabs" @tab-change="handleCategoryChange">
          <el-tab-pane label="全部资料" name=""></el-tab-pane>
          <el-tab-pane label="📖 考研资料" name="考研资料"></el-tab-pane>
          <el-tab-pane label="🏛️ 考公资料" name="考公资料"></el-tab-pane>
          <el-tab-pane label="🔤 四六级" name="四六级"></el-tab-pane>
        </el-tabs>

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
              <el-button type="primary" icon="Download" @click="handleDownload(item.download_url)">
                获取资料
              </el-button>
            </div>
          </div>
        </el-card>

      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../utils/request'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import NavBar from '../components/NavBar.vue'

const router = useRouter()
const activeCategory = ref('')
const studyList = ref([])

const fetchStudyMaterials = async (category = '') => {
  try {
    const res = await request.get('/api/study', {
      params: { category: category }
    })
    if (res.data.code === 200) {
      studyList.value = res.data.data
    }
  } catch (error) {
    ElMessage.error('获取资料列表失败')
  }
}

const handleCategoryChange = (tabName) => {
  fetchStudyMaterials(tabName)
}

const handleDownload = (url) => {
  ElMessage.success('正在为您跳转到下载页面...')
  setTimeout(() => {
    window.open(url, '_blank')
  }, 800)
}

onMounted(() => {
  fetchStudyMaterials()
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
.category-tabs {
  margin-bottom: 20px;
  background: white;
  padding: 0 20px;
  border-radius: 8px;
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
</style>