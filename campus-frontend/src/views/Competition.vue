<template>
  <div class="common-layout">
    <el-container>
      <NavBar title="🏆 竞赛组队大厅" bgColor="#67C23A">
        <el-button @click="router.push('/home')" icon="Back">返回主页</el-button>
      </NavBar>

      <el-main class="main-content">
        <div class="filter-bar">
          <el-radio-group v-model="activeStatus" @change="handleStatusChange">
            <el-radio-button label="">全部组队</el-radio-button>
            <el-radio-button label="招募中">🔥 招募中</el-radio-button>
            <el-radio-button label="已满员">✅ 已满员</el-radio-button>
          </el-radio-group>
          <el-button type="success" icon="Plus" @click="dialogVisible = true">发布招募</el-button>
        </div>

        <el-row :gutter="20">
          <el-col :span="12" v-for="item in compList" :key="item.id" class="comp-col">
            <el-card shadow="hover" class="comp-card" :class="{ 'is-full': item.status === '已满员' }">
              <template #header>
                <div class="card-header">
                  <div class="title-area">
                    <el-tag type="warning" effect="dark" size="small">{{ item.comp_name }}</el-tag>
                    <span class="comp-title">{{ item.title }}</span>
                  </div>
                  <el-tag :type="item.status === '招募中' ? 'success' : 'info'" effect="plain">
                    {{ item.status }}
                  </el-tag>
                </div>
              </template>
              
              <div class="comp-body">
                <p class="comp-desc">{{ item.description }}</p>
                <div class="skills-req">
                  <span style="font-size: 13px; color: #909399; margin-right: 8px;">急需技能:</span>
                  <el-tag v-for="skill in (item.required_skills ? item.required_skills.split(',') : [])" 
                          :key="skill" size="small" style="margin-right: 5px;">
                    {{ skill.trim() }}
                  </el-tag>
                </div>
              </div>
              
              <div class="comp-footer">
                <span class="time-text">发布于: {{ new Date(item.created_at).toLocaleDateString() }}</span>
                
                <div style="display: flex; align-items: center; gap: 10px;">
                  <el-tooltip :content="item.is_favorited ? '取消收藏' : '加入收藏'" placement="top">
                    <el-button 
                      :type="item.is_favorited ? 'warning' : 'info'" 
                      link 
                      :icon="item.is_favorited ? 'StarFilled' : 'Star'" 
                      @click="handleFavorite(item)" 
                      style="font-size: 20px;" 
                    />
                  </el-tooltip>

                  <el-popover v-if="item.status === '招募中'" placement="top" :width="200" trigger="click" :content="'联系方式: ' + item.contact_info">
                    <template #reference>
                      <el-button type="success" plain size="small">联系队长</el-button>
                    </template>
                  </el-popover>
                  <el-button v-else type="info" plain size="small" disabled>暂不缺人</el-button>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-empty v-if="compList.length === 0" description="暂无组队信息" />

        <div class="pagination-container" v-if="totalCompetitions > 0">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[6, 10, 20, 50]"
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="totalCompetitions"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-main>

      <el-dialog v-model="dialogVisible" title="🏆 发布竞赛招募" width="50%">
          <el-form :model="compForm" label-width="80px">
            <el-form-item label="竞赛名称" required>
              <el-input v-model="compForm.comp_name" placeholder="例如：全国大学生数学建模竞赛" />
            </el-form-item>
            <el-form-item label="招募口号" required>
              <el-input v-model="compForm.title" placeholder="一句话吸引神仙队友" />
            </el-form-item>
            <el-form-item label="所需技能">
              <el-input v-model="compForm.required_skills" placeholder="例如：Python, 数据分析, 论文排版 (逗号隔开)" />
            </el-form-item>
            <el-form-item label="联系方式">
              <el-input v-model="compForm.contact_info" placeholder="留下你的微信号或QQ群号" />
            </el-form-item>
            <el-form-item label="项目详情" required>
              <el-input v-model="compForm.description" type="textarea" :rows="5" placeholder="详细介绍一下你的项目进度和对队友的具体要求..." />
            </el-form-item>
          </el-form>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="dialogVisible = false">取 消</el-button>
              <el-button type="success" @click="submitCompetition">发 布 招 募</el-button>
            </span>
          </template>
        </el-dialog>
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
const activeStatus = ref('')
const compList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalCompetitions = ref(0)
const isPageActive = ref(true)
const syncFavoriteIds = (targetId, shouldInclude) => {
  const ids = new Set(myFavoriteIds.value)
  if (shouldInclude) {
    ids.add(targetId)
  } else {
    ids.delete(targetId)
  }
  myFavoriteIds.value = Array.from(ids)
}
// 👉 [新增] 弹窗可见性与表单数据
const dialogVisible = ref(false)
const compForm = ref({
  comp_name: '',
  title: '',
  required_skills: '',
  contact_info: '',
  description: ''
})

const myFavoriteIds = ref([])

const fetchMyFavorites = async () => {
  try {
    const res = await request.get('/api/user/favorites', { params: { type: 'competition' } })
    if (!isPageActive.value) return
    if (res.data.code === 200) myFavoriteIds.value = res.data.data.map(item => item.id)
  } catch (error) { }
}

const fetchCompetitions = async () => {
  try {
    const res = await request.get('/api/competitions', {
      params: {
        status: activeStatus.value,
        page: currentPage.value,
        limit: pageSize.value
      }
    })
    if (!isPageActive.value) return
    if (res.data.code === 200) {
      // 👉 注入收藏状态
      compList.value = res.data.data.map(item => ({
        ...item,
        is_favorited: myFavoriteIds.value.includes(item.id)
      }))
      totalCompetitions.value = res.data.total || 0
    }
  } catch (error) { ElMessage.error('获取组队列表失败') }
}

const handleStatusChange = () => {
  currentPage.value = 1
  fetchCompetitions()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  fetchCompetitions()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchCompetitions()
}
// 👉 [新增] 提交竞赛招募的方法
const submitCompetition = async () => {
  // 防呆校验
  if (!compForm.value.comp_name || !compForm.value.title || !compForm.value.description) {
    return ElMessage.warning('带星号的都是必填项哦！')
  }
  
  try {
    const res = await request.post('/api/competitions', compForm.value)
    if (!isPageActive.value) return
    if (res.data.code === 200) {
      ElMessage.success('招募发布成功！')
      dialogVisible.value = false // 关闭弹窗

      const createdItem = {
        ...res.data.data,
        is_favorited: false
      }

      // 无感更新：在第一页时直接插入，避免每次都整页刷新
      if (currentPage.value === 1 && (!activeStatus.value || activeStatus.value === createdItem.status)) {
        compList.value.unshift(createdItem)
        if (compList.value.length > pageSize.value) {
          compList.value.pop()
        }
        totalCompetitions.value += 1
      } else {
        currentPage.value = 1
        await fetchCompetitions()
      }

      // 清空表单数据，为下次发布做准备
      compForm.value = { comp_name: '', title: '', required_skills: '', contact_info: '', description: '' }
    } else {
      ElMessage.error(res.data.message)
    }
  } catch (error) {
    const msg = error?.response?.data?.message || '发布失败，请检查登录状态'
    ElMessage.error(msg)
  }
}

const handleFavorite = async (item) => {
  try {
    const res = await request.post('/api/favorites/toggle', {
      target_id: item.id,
      target_type: 'competition'
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

onMounted(async () => {
  await fetchMyFavorites()
  await fetchCompetitions()
})

onUnmounted(() => {
  isPageActive.value = false
})
</script>

<style scoped>
.header {
  background-color: #67C23A; /* 竞赛绿 */
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
.filter-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  background: white;
  padding: 15px 20px;
  border-radius: 8px;
}
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 12px;
  padding-bottom: 8px;
}
.comp-col {
  margin-bottom: 20px;
}
.comp-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s;
}
.is-full {
  opacity: 0.7; /* 满员的卡片整体变灰一点 */
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title-area {
  display: flex;
  align-items: center;
  gap: 10px;
}
.comp-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}
.comp-body {
  flex-grow: 1;
}
.comp-desc {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 15px;
}
.skills-req {
  margin-bottom: 10px;
}
.comp-footer {
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