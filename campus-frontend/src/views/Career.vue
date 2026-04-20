<template>
  <div class="common-layout">
    <el-container>
      <NavBar title="💼 实习与就业面经" bgColor="#E6A23C">
        <el-button @click="router.push('/home')" icon="Back">返回主页</el-button>
      </NavBar>

      <el-main class="main-content">
        <el-tabs v-model="activeType" class="category-tabs" @tab-change="fetchCareers">
          <el-tab-pane label="全部信息" name=""></el-tab-pane>
          <el-tab-pane label="🚀 校招内推" name="校招内推"></el-tab-pane>
          <el-tab-pane label="💻 实习机会" name="实习机会"></el-tab-pane>
          <el-tab-pane label="📝 面试经验" name="面试经验"></el-tab-pane>
        </el-tabs>

        <el-row :gutter="20">
          <el-col :span="24" v-for="item in careerList" :key="item.id" class="career-col">
            <el-card shadow="hover" class="career-card">
              
              <div class="card-wrapper">
                
                <div class="card-left">
                  <div class="job-header">
                    <span class="job-title">{{ item.title }}</span>
                    <el-tag :type="getTypeTag(item.type)" effect="dark" size="small" style="margin-left: 10px;">
                      {{ item.type }}
                    </el-tag>
                  </div>
                  <div class="company-name">🏢 {{ item.company }}</div>
                  <p class="job-content">{{ item.content }}</p>
                  <div class="job-tags">
                    <el-tag v-for="tag in (item.tags ? item.tags.split(',') : [])" 
                            :key="tag" type="info" size="small" class="custom-tag">
                      {{ tag.trim() }}
                    </el-tag>
                  </div>
                </div>
                
                <div class="card-right">
                  <div class="publish-time">发布于: {{ new Date(item.created_at).toLocaleDateString() }}</div>
                  <el-button v-if="item.type !== '面试经验'" type="warning" @click="handleApply(item.contact)">
                    查看投递方式
                  </el-button>
                </div>

              </div> </el-card>
          </el-col>
        </el-row>

        <el-empty v-if="careerList.length === 0" description="暂无相关信息" />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../utils/request'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import NavBar from '../components/NavBar.vue'

const router = useRouter()
const activeType = ref('')
const careerList = ref([])

const fetchCareers = async () => {
  try {
    const res = await request.get('/api/careers', {
      params: { type: activeType.value }
    })
    if (res.data.code === 200) {
      careerList.value = res.data.data
    }
  } catch (error) {
    ElMessage.error('获取就业信息失败')
  }
}

// 动态返回标签颜色
const getTypeTag = (type) => {
  const map = {
    '校招内推': 'danger',
    '实习机会': 'warning',
    '面试经验': 'success'
  }
  return map[type] || 'info'
}

// 点击投递按钮弹出联系方式
const handleApply = (contact) => {
  ElMessageBox.alert(contact, '投递方式 / 内推码', {
    confirmButtonText: '知道了',
    type: 'info',
  })
}

onMounted(() => {
  fetchCareers()
})
</script>

<style scoped>
.header {
  background-color: #E6A23C; /* 活力橙 */
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
.main-content {
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
  padding: 20px 15%; /* 列表布局，两边留白多一点 */
}
.category-tabs {
  margin-bottom: 20px;
  background: white;
  padding: 0 20px;
  border-radius: 8px;
}
.career-col {
  margin-bottom: 15px;
}
.career-card {
  display: flex;
  justify-content: space-between;
}
/* 👉 [新增] 包装盒的 Flex 布局 */
.card-wrapper {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
.card-left {
  flex: 1; /* 左侧自动占满剩余空间 */
  padding-right: 20px;
  min-width: 0; /* 👉 关键防爆雷：防止左边文字太长把右边挤没 */
}
.card-right {
  display: flex;
  flex-direction: column;
  justify-content: center; 
  align-items: flex-end;
  min-width: 150px;
  border-left: 1px dashed #ebeef5;
  padding-left: 20px;
  gap: 15px; 
  flex-shrink: 0; /* 👉 关键防爆雷：无论左边多长，右边这块区域绝对不允许被压缩！*/
}
.job-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.job-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}
.company-name {
  font-size: 14px;
  color: #409EFF;
  margin-bottom: 12px;
  font-weight: 500;
}
.job-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 15px;
}
.custom-tag {
  margin-right: 8px;
  background-color: #f0f2f5;
  border-color: #e9e9eb;
  color: #909399;
}

.publish-time {
  font-size: 12px;
  color: #C0C4CC;
}

</style>