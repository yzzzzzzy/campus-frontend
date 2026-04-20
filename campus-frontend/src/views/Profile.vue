<template>
  <div class="common-layout">
    <el-container>
      <NavBar title="👤 个人中心" bgColor="#909399" :showDropdown="false" />

      <el-main class="main-content">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card shadow="hover" class="profile-card">
              <div class="avatar-container">
                <el-avatar :size="120" :src="userInfo.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
              </div>
              <h2 class="nickname">{{ userInfo.nickname || '未设置昵称' }}</h2>
              <div class="signature">
                <el-tag type="info" size="small">{{ userInfo.major || '专业未设置' }}</el-tag>
              </div>
              <el-divider />
              <div class="data-stats">
                <div class="stat-item">
                  <div class="stat-num">{{ myPosts.length }}</div>
                  <div class="stat-label">发帖数</div>
                </div>
                <div class="stat-item">
                  <div class="stat-num">{{ userStats.totalLikes }}</div>
                  <div class="stat-label">获赞数</div>
                </div>
              </div>
            </el-card>
          </el-col>

          <el-col :span="18">
            <el-card shadow="hover" class="content-card">
              <el-tabs v-model="activeTab" class="profile-tabs">
                
                <el-tab-pane label="📝 我的发布" name="posts">
                  <el-empty v-if="myPosts.length === 0" description="你还没有发布过帖子哦~" />
                  
                  <div v-for="post in myPosts" :key="post.id" class="my-post-item">
                    <div class="post-header">
                      <h4>{{ post.title }}</h4>
                      <el-tag type="success" size="small">{{ post.category_name }}</el-tag>
                    </div>
                    <p class="post-content">{{ post.content }}</p>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                      <span class="post-time">发布于: {{ new Date(post.created_at).toLocaleString() }}</span>
                      <el-button type="danger" link icon="Delete" @click="handleDeletePost(post.id)">
                        删除帖子
                      </el-button>
                    </div>
                  </div>
                </el-tab-pane>

                <el-tab-pane label="⭐ 我的收藏" name="favorites">
                  <el-empty v-if="myFavorites.length === 0" description="你的收藏夹空空如也~" />
                  
                  <div v-for="item in myFavorites" :key="item.id" class="my-post-item">
                    <div class="post-header">
                      <h4>{{ item.title }}</h4>
                      <el-tag type="warning" size="small">{{ item.category_name }}</el-tag>
                    </div>
                    <p class="post-content">{{ item.content }}</p>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                      <span class="post-time">收藏于: {{ new Date(item.favorited_at).toLocaleString() }}</span>
                      <el-button type="danger" link icon="Delete" @click="handleUnfavorite(item.id)">
                        取消收藏
                      </el-button>
                    </div>
                  </div>
                </el-tab-pane>

                <el-tab-pane label="⚙️ 个人设置" name="settings">
                  <div class="settings-form">
                    <el-form :model="settingsForm" label-width="100px" label-position="left">
                      <el-form-item label="用户昵称">
                        <el-input v-model="settingsForm.nickname" placeholder="给自己起个好听的昵称" />
                      </el-form-item>
                      <el-form-item label="头像链接 (URL)">
                        <el-input v-model="settingsForm.avatar" placeholder="请输入图片的网络链接，例如 http://..." />
                        <div class="tip-text">您可以右键网页上的图片选择“复制图片地址”并粘贴于此。</div>
                      </el-form-item>
                      <el-form-item label="专业名称">
                        <el-input v-model="settingsForm.major" placeholder="例如：计算机科学与技术" disabled />
                        <div class="tip-text">专业信息需联系管理员修改</div>
                      </el-form-item>
                      <el-form-item>
                        <el-button type="primary" @click="saveSettings">保存修改</el-button>
                        <el-button type="danger" plain @click="handleLogout" style="margin-left: 15px;">退出登录</el-button>
                      </el-form-item>
                      
                    </el-form>
                  </div>
                </el-tab-pane>

              </el-tabs>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../utils/request'
import NavBar from '../components/NavBar.vue' // 👉 引入通用导航栏组件
import { ElMessage, ElMessageBox } from 'element-plus'

const userInfo = ref({})
const myPosts = ref([])
const myFavorites = ref([]) // 👉 [新增] 我的收藏列表
const activeTab = ref('posts')
const userStats = ref({ totalLikes: 0 }) // 👉 [新增] 存放统计数据

// 👉 [新增] 拉取获赞统计
const fetchUserStats = async () => {
  try {
    const res = await request.get('/api/user/stats')
    if (res.data.code === 200) {
      userStats.value.totalLikes = res.data.data.totalLikes
    }
  } catch (error) {}
}

// 记得在 onMounted 里调用 fetchUserStats()

// 设置表单的数据
const settingsForm = ref({
  nickname: '',
  avatar: '',
  major: ''
})

const fetchUserInfo = async () => {
  try {
    const res = await request.get('/api/user/info')
    if (res.data.code === 200) {
      userInfo.value = res.data.data
      // 把当前信息同步到设置表单里
      settingsForm.value.nickname = userInfo.value.nickname
      settingsForm.value.avatar = userInfo.value.avatar
      settingsForm.value.major = userInfo.value.major
    }
  } catch (error) {
    ElMessage.error('获取用户信息失败')
  }
}

const fetchMyPosts = async () => {
  try {
    const res = await request.get('/api/user/posts')
    if (res.data.code === 200) {
      myPosts.value = res.data.data
    }
  } catch (error) {
    ElMessage.error('获取帖子失败')
  }
}

// 保存设置逻辑
const saveSettings = async () => {
  try {
    const res = await request.put('/api/user/info', {
      nickname: settingsForm.value.nickname,
      avatar: settingsForm.value.avatar
    })
    
    if (res.data.code === 200) {
      ElMessage.success('个人资料已更新！')
      // 重新拉取一次用户信息，让左侧名片和导航栏头像立刻刷新
      fetchUserInfo() 
      // 这里的极致体验应该是页面直接响应，但最稳妥的是刷新页面，或者通过全局状态管理
      setTimeout(() => { location.reload() }, 1000) 
    }
  } catch (error) {
    ElMessage.error('更新失败')
  }
}
// 👉 [新增] 退出登录逻辑
const handleLogout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}
// 👉 [新增] 获取我的收藏
const fetchMyFavorites = async () => {
  try {
    const res = await request.get('/api/user/favorites')
    if (res.data.code === 200) {
      myFavorites.value = res.data.data
    }
  } catch (error) {
    ElMessage.error('获取收藏失败')
  }
}
// 👉 [新增] 在个人中心取消收藏
const handleUnfavorite = async (postId) => {
  try {
    // 调用我们之前写好的万能 toggle 接口
    const res = await request.post('/api/favorites/toggle', {
      target_id: postId,
      target_type: 'post'
    })
    
    if (res.data.code === 200) {
      ElMessage.success('已移出收藏夹')
      // 👉 核心体验优化：不需要刷新网页，直接用 JS 把这条数据从数组里剔除掉！
      myFavorites.value = myFavorites.value.filter(item => item.id !== postId)
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}
// 👉 [新增] 安全删除我的帖子
const handleDeletePost = async (postId) => {
  try {
    // 1. 弹出二次确认框，防止手抖误删
    await ElMessageBox.confirm(
      '确定要永久删除这篇帖子吗？相关的评论和收藏也会被一并清空哦！',
      '⚠️ 删除确认',
      {
        confirmButtonText: '残忍删除',
        cancelButtonText: '手滑了',
        type: 'warning',
      }
    )

    // 2. 如果用户点了“残忍删除”，就会执行下面的发请求逻辑
    const res = await request.delete(`/api/posts/${postId}`)
    
    if (res.data.code === 200) {
      ElMessage.success('帖子已彻底删除')
      
      // 3. 无感移除：直接用 JS 从数组里剔除这篇帖子
      myPosts.value = myPosts.value.filter(post => post.id !== postId)
      
      // 注意：左侧个人名片里的“发帖数”绑定的是 myPosts.length，
      // 所以你从数组剔除后，左边卡片上的数字也会自动减 1，极其丝滑！
    } else {
      ElMessage.error(res.data.message)
    }
  } catch (error) {
    // 如果用户点了“手滑了”取消操作，或者关掉弹窗，会走到这里，我们什么都不用做
    if (error !== 'cancel') {
      ElMessage.error('网络请求失败')
    }
  }
}

onMounted(() => {
  fetchUserInfo()
  fetchMyPosts()
  fetchMyFavorites()
  fetchUserStats()
})
</script>

<style scoped>
.main-content {
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
  padding: 20px 10%;
}
.profile-card {
  text-align: center;
  padding-bottom: 10px;
}
.avatar-container {
  margin-top: 10px;
  margin-bottom: 15px;
}
.nickname {
  margin: 10px 0;
  color: #303133;
}
.data-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
}
.stat-item {
  text-align: center;
}
.stat-num {
  font-size: 20px;
  font-weight: bold;
  color: #409EFF;
}
.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
.content-card {
  min-height: 500px;
}
.profile-tabs {
  padding: 0 10px;
}
.settings-form {
  padding: 20px 40px;
  max-width: 500px;
}
.tip-text {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  line-height: 1.4;
}
.my-post-item {
  border-bottom: 1px solid #ebeef5;
  padding: 15px 0;
}
.post-header h4 { margin: 0 0 10px 0; }
.post-content { font-size: 14px; color: #606266; margin-bottom: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.post-time { font-size: 12px; color: #909399; }
</style>