<template>
  <div class="common-layout">
    <el-container>
      <NavBar title="🚀 个人提升资料库" bgColor="#9C27B0">
        <el-button @click="router.push('/home')" icon="Back">返回主页</el-button>
      </NavBar>
      

      <el-main class="main-content">
        <el-tabs v-model="activeCategory" class="category-tabs" @tab-change="handleCategoryChange">
          <el-tab-pane label="全部资源" name=""></el-tab-pane>
          <el-tab-pane label="💻 编程开发" name="编程开发"></el-tab-pane>
          <el-tab-pane label="🎨 创意设计" name="创意设计"></el-tab-pane>
          <el-tab-pane label="📈 办公效率" name="办公效率"></el-tab-pane>
        </el-tabs>

        <el-row :gutter="20">
          <el-col :span="8" v-for="item in resourceList" :key="item.id" class="resource-col">
            <el-card shadow="hover" class="resource-card">
              <template #header>
                <div class="card-header">
                  <span class="resource-title">{{ item.title }}</span>
                  <el-tag :type="getTagType(item.type)" size="small">{{ item.type }}</el-tag>
                </div>
              </template>
              <div class="resource-body">
                <p class="resource-desc">{{ item.description }}</p>
              </div>
              <div class="resource-footer">
                <span class="time-text">收录于: {{ new Date(item.created_at).toLocaleDateString() }}</span>
                <el-button type="primary" plain size="small" @click="goToLearn(item.url)">
                  前往学习
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-empty v-if="resourceList.length === 0" description="该分类下暂无资源，敬请期待！" />
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
const activeCategory = ref('') // 当前选中的分类，空字符串代表全部
const resourceList = ref([])

// 获取资源列表的方法，支持传入分类参数
const fetchResources = async (type = '') => {
  try {
    const res = await request.get('/api/resources', {
      params: { type: type }
    })
    if (res.data.code === 200) {
      resourceList.value = res.data.data
    }
  } catch (error) {
    ElMessage.error('获取资源列表失败')
  }
}

// 切换分类标签时触发
const handleCategoryChange = (tabName) => {
  fetchResources(tabName)
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

// 页面加载时默认获取全部资源
onMounted(() => {
  fetchResources()
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
.category-tabs {
  margin-bottom: 20px;
  background: white;
  padding: 0 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
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
</style>