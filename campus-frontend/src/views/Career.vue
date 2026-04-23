<template>
  <div class="common-layout">
    <el-container>
      <NavBar title="💼 实习与就业面经" bgColor="#E6A23C">
        <el-button @click="router.push('/home')" icon="Back">返回主页</el-button>
      </NavBar>

      <el-dialog v-model="publishDialogVisible" title="分享面试经验" width="520px" destroy-on-close>
        <el-alert
          title="普通用户只能发布面试经验。其他就业信息后续由管理员后台统一上传。"
          type="info"
          show-icon
          :closable="false"
          style="margin-bottom: 16px;"
        />
        <el-form :model="publishForm" label-position="top">
          <el-form-item label="公司 / 企业名称">
            <el-input v-model="publishForm.company" placeholder="例如：腾讯 / 字节跳动 / 美团" maxlength="100" show-word-limit />
          </el-form-item>
          <el-form-item label="面经标题">
            <el-input v-model="publishForm.title" placeholder="例如：腾讯前端二面面经" maxlength="100" show-word-limit />
          </el-form-item>
          <el-form-item label="面试经验内容">
            <el-input
              v-model="publishForm.content"
              type="textarea"
              :rows="7"
              placeholder="描述面试流程、八股、算法题、感受等"
              maxlength="5000"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="标签（逗号分隔，可选）">
            <el-input v-model="publishForm.tags" placeholder="例如：Java, 前端, 已拿Offer" maxlength="255" show-word-limit />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="publishDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="publishing" @click="handlePublishExperience">发布面经</el-button>
        </template>
      </el-dialog>

      <el-main class="main-content">
        <div class="filter-container">
          <el-tabs v-model="activeType" class="category-tabs" @tab-change="fetchCareers">
            <el-tab-pane label="全部信息" name=""></el-tab-pane>
            <el-tab-pane label="🚀 校招内推" name="校招内推"></el-tab-pane>
            <el-tab-pane label="💻 实习机会" name="实习机会"></el-tab-pane>
            <el-tab-pane label="📝 面试经验" name="面试经验"></el-tab-pane>
          </el-tabs>
          
          <el-button type="warning" @click="publishDialogVisible = true" icon="EditPen">分享面经</el-button>
        </div>

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
                  
                  <div style="display: flex; align-items: center; gap: 15px;">
                    <el-tooltip :content="item.is_favorited ? '取消收藏' : '加入收藏'" placement="top">
                      <el-button 
                        :type="item.is_favorited ? 'warning' : 'info'" 
                        link 
                        :icon="item.is_favorited ? 'StarFilled' : 'Star'" 
                        @click="handleFavorite(item)" 
                        style="font-size: 22px;" 
                      />
                    </el-tooltip>

                    <el-button v-if="item.type !== '面试经验'" type="warning" @click="handleApply(item.contact)">
                      查看投递方式
                    </el-button>
                  </div>
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
import { ref, onMounted, onUnmounted } from 'vue'
import request from '../utils/request'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import NavBar from '../components/NavBar.vue'

const router = useRouter()
const activeType = ref('')
const careerList = ref([])
const myFavoriteIds = ref([])
const isPageActive = ref(true)
const publishDialogVisible = ref(false)
const publishing = ref(false)
const publishForm = ref({
  company: '',
  title: '',
  content: '',
  tags: ''
})

const syncFavoriteIds = (targetId, shouldInclude) => {
  const ids = new Set(myFavoriteIds.value)
  if (shouldInclude) {
    ids.add(targetId)
  } else {
    ids.delete(targetId)
  }
  myFavoriteIds.value = Array.from(ids)
}

const fetchMyFavorites = async () => {
  try {
    const res = await request.get('/api/user/favorites', { params: { type: 'career' } })
    if (!isPageActive.value) return
    if (res.data.code === 200) myFavoriteIds.value = res.data.data.map(item => item.id)
  } catch (error) { }
}
const fetchCareers = async () => {
  try {
    const res = await request.get('/api/careers', { params: { type: activeType.value } })
    if (!isPageActive.value) return
    if (res.data.code === 200) {
      // 合并 is_favorited 状态
      careerList.value = res.data.data.map(item => ({
        ...item,
        is_favorited: myFavoriteIds.value.includes(item.id)
      }))
    }
  } catch (error) { ElMessage.error('获取就业信息失败') }
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
// 👉 [新增] 3. 收藏点击事件
const handleFavorite = async (item) => {
  try {
    const res = await request.post('/api/favorites/toggle', {
      target_id: item.id,
      target_type: 'career' // 告诉后端收藏的是实习信息
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

const handlePublishExperience = async () => {
  if (!publishForm.value.company || !publishForm.value.title || !publishForm.value.content) {
    ElMessage.warning('公司、标题和内容不能为空')
    return
  }

  publishing.value = true
  try {
    const res = await request.post('/api/careers', {
      company: publishForm.value.company,
      title: publishForm.value.title,
      type: '面试经验',
      content: publishForm.value.content,
      tags: publishForm.value.tags,
      contact: '无需投递'
    })

    if (!isPageActive.value) return

    if (res.data.code === 200) {
      ElMessage.success(res.data.message || '面经发布成功，感谢分享！')
      publishDialogVisible.value = false
      publishForm.value = { company: '', title: '', content: '', tags: '' }
      await fetchCareers()
    } else {
      ElMessage.error(res.data.message)
    }
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || '发布失败，请检查登录状态')
  } finally {
    publishing.value = false
  }
}

onMounted(async () => {
  await fetchMyFavorites()
  await fetchCareers()
})

onUnmounted(() => {
  isPageActive.value = false
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
/* 整合后的控制区样式 */
.filter-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  margin-bottom: 20px;
  padding: 0 20px;
  border-radius: 8px;
}

.category-tabs {
  flex: 1; /* 让标签页占满左边 */
  margin-bottom: 0; 
  padding: 0;
  background: transparent;
}

:deep(.el-tabs__header) {
  margin: 0;
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