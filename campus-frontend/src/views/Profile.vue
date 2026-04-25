<template>
  <div class="common-layout">
    <el-container>
      <NavBar title="👤 个人中心" bgColor="#909399" :showDropdown="false">
        <el-button @click="router.push('/home')" icon="Back">返回主页</el-button>
      </NavBar>

      <el-main class="main-content">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="24" :md="6">
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

          <el-col :xs="24" :sm="24" :md="18">
            <el-card shadow="hover" class="content-card">
              <el-tabs v-model="activeTab" class="profile-tabs">
                
                <el-tab-pane label="📝 我的发布" name="posts">
                  <el-empty v-if="myPosts.length === 0" description="你还没有发布过帖子哦~" />
                  
                  <div v-for="post in myPosts" :key="post.item_type + post.id" class="my-post-item">
                    <div class="post-header">
                      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <h4 style="margin: 0;">{{ post.title }}</h4>
                        <el-tag :type="post.item_type === 'post' ? '' : (post.item_type === 'career' ? 'warning' : 'success')" size="small">
                          {{ post.item_type === 'post' ? '论坛帖子' : (post.item_type === 'career' ? '实习面经' : '竞赛招募') }}
                        </el-tag>
                        <el-tag type="info" effect="plain" size="small">{{ post.category_name }}</el-tag>
                      </div>
                    </div>
                    <p class="post-content">{{ post.content }}</p>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                      <span class="post-time">发布于: {{ new Date(post.created_at).toLocaleString() }}</span>
                      
                      <el-button type="danger" link icon="Delete" @click="handleDeletePost(post)">
                        删除
                      </el-button>
                    </div>
                  </div>
                </el-tab-pane>

                <el-tab-pane label="⭐ 我的收藏" name="favorites">
                  <div style="margin-bottom: 20px; text-align: center;">
                    <el-radio-group v-model="favoriteType" @change="fetchMyFavorites">
                      <el-radio-button value="post">论坛帖子</el-radio-button>
                      <el-radio-button value="study">升学资料</el-radio-button>
                      <el-radio-button value="career">实习就业</el-radio-button>
                      <el-radio-button value="resource">提升资源</el-radio-button>
                      <el-radio-button value="competition">竞赛招募</el-radio-button>
                    </el-radio-group>
                  </div>

                  <el-empty v-if="myFavorites.length === 0" description="这个分类下空空如也~" />
                  
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
                      <el-form-item label="修改头像">
                        <el-upload
                        class="avatar-uploader"
                        :action="uploadAction"  :show-file-list="false"
                        :on-success="handleAvatarSuccess"
                        :on-error="handleAvatarError"
                        :before-upload="beforeAvatarUpload"
                        :headers="uploadHeaders"
                        >
                          <img v-if="settingsForm.avatar" :src="settingsForm.avatar" class="avatar-preview" />
                          <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
                        </el-upload>
                        <div class="tip-text">支持 JPG/PNG，大小不超过 2MB</div>
                      </el-form-item>
                      <el-form-item label="专业名称">
                        <el-input v-model="settingsForm.major" placeholder="例如：计算机科学与技术" disabled />
                        <div class="tip-text">专业信息需联系管理员修改</div>
                      </el-form-item>
                      <el-form-item>
                        <el-button type="primary" @click="saveSettings" :disabled="isSaveDisabled">保存修改</el-button>
                        <el-button type="info" plain @click="handleLogout" style="margin-left: 15px;">退出登录</el-button>
                        <el-button type="danger" @click="handleDeleteAccount" style="margin-left: 15px;">注销账号</el-button>
                      </el-form-item>
                      
                    </el-form>

                    <el-divider content-position="left">修改密码</el-divider>

                    <el-form :model="passwordForm" label-width="100px" label-position="left" class="password-form">
                      <el-form-item label="当前密码">
                        <el-input v-model="passwordForm.currentPassword" type="password" show-password placeholder="请输入当前密码" autocomplete="current-password" />
                      </el-form-item>
                      <el-form-item label="新密码">
                        <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" autocomplete="new-password" />
                      </el-form-item>
                      <el-form-item label="确认密码">
                        <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="再次输入新密码" autocomplete="new-password" />
                      </el-form-item>
                      <el-form-item>
                        <el-button type="warning" @click="handleChangePassword" :disabled="isPasswordChangeDisabled">修改密码</el-button>
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import request, { API_BASE_URL } from '../utils/request'
import NavBar from '../components/NavBar.vue' // 👉 引入通用导航栏组件
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const userInfo = ref({})
const myPosts = ref([])
const myFavorites = ref([]) // 👉 [新增] 我的收藏列表
const favoriteType = ref('post') // 👉 [新增] 收藏类型
const activeTab = ref('posts')
const userStats = ref({ totalLikes: 0 }) // 👉 [新增] 存放统计数据
const uploadAction = `${API_BASE_URL}/api/upload`
const isPageActive = ref(true)

// 👉 [新增] 拉取获赞统计
const fetchUserStats = async () => {
  try {
    const res = await request.get('/api/user/stats')
    if (!isPageActive.value) return
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

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const fetchUserInfo = async () => {
  try {
    const res = await request.get('/api/user/info')
    if (!isPageActive.value) return
    if (res.data.code === 200) {
      userInfo.value = res.data.data
      
      // 把当前信息同步到设置表单里
      settingsForm.value.nickname = userInfo.value.nickname
      
      // 👉 [核心修改] 故意不要把原有头像塞进表单！让它保持为空，这样默认就是灰色加号！
      settingsForm.value.avatar = '' 
      
      settingsForm.value.major = userInfo.value.major
    }
  } catch (error) {
    ElMessage.error('获取用户信息失败')
  }
}
// 👉 [新增] 计算保存按钮是否应该被禁用
const isSaveDisabled = computed(() => {
  // 条件1：昵称和原来的一模一样
  const isNicknameUnchanged = settingsForm.value.nickname === userInfo.value.nickname;
  // 条件2：头像框是空的（灰色的加号状态）
  const isAvatarEmpty = !settingsForm.value.avatar;
  
  // 只有当两个条件都满足（什么都没改）时，才禁用按钮
  return isNicknameUnchanged && isAvatarEmpty;
});

const isPasswordChangeDisabled = computed(() => {
  return !passwordForm.value.currentPassword || !passwordForm.value.newPassword || !passwordForm.value.confirmPassword
})


const fetchMyPosts = async () => {
  try {
    const res = await request.get('/api/user/posts')
    if (!isPageActive.value) return
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
      // 👉 [核心修改] 如果右边表单里有新头像，就用新的；如果是空的，就用左边名片里原本的头像！
      avatar: settingsForm.value.avatar || userInfo.value.avatar
    })
    if (!isPageActive.value) return
    
    if (res.data.code === 200) {
      ElMessage.success('个人资料已更新！')
      
      // 1. 重新拉取用户信息，更新左侧名片
      await fetchUserInfo()
      
      // 👉 2. [核心修改] 直接清空头像数据，加号瞬间回来
      settingsForm.value.avatar = ''
      
      // 👉 3. [删除强制刷新] 既然数据已经双向绑定自动更新了，
      // 我们就不需要 location.reload() 这种暴力刷新了，这样体验更丝滑！
    }
  } catch (error) {
    ElMessage.error('更新失败')
  }
}

const handleChangePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    ElMessage.error('两次输入的新密码不一致')
    return
  }

  try {
    const res = await request.put('/api/user/password', {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword,
      confirmPassword: passwordForm.value.confirmPassword
    })

    if (res.data.code === 200) {
      ElMessage.success('密码修改成功，请重新登录')
      passwordForm.value.currentPassword = ''
      passwordForm.value.newPassword = ''
      passwordForm.value.confirmPassword = ''
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    } else {
      ElMessage.error(res.data.message)
    }
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || '修改密码失败')
  }
}
// 👉 [新增] 退出登录逻辑
const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}
// 👉 [新增] 获取我的收藏
const fetchMyFavorites = async () => {
  try {
    const res = await request.get('/api/user/favorites', {
      params: { type: favoriteType.value } // 传参给后端！
    })
    if (!isPageActive.value) return
    if (res.data.code === 200) {
      myFavorites.value = res.data.data
    }
  } catch (error) {
    ElMessage.error('获取收藏失败')
  }
}
// 👉 [新增] 在个人中心取消收藏
const handleUnfavorite = async (itemId) => {
  try {
    const res = await request.post('/api/favorites/toggle', {
      target_id: itemId,
      target_type: favoriteType.value // 取消帖子就是 post，取消资料就是 study
    })
    
    if (res.data.code === 200) {
      ElMessage.success('已移出收藏夹')
      myFavorites.value = myFavorites.value.filter(item => item.id !== itemId)
    }
  } catch (error) { ElMessage.error('操作失败') }
}
// 👉 [智能升级版] 安全删除我的发布（支持多种类型）
const handleDeletePost = async (post) => {
  try {
    await ElMessageBox.confirm('确定要永久删除这条发布吗？相关的评论和收藏也会被一并清空哦！', '⚠️ 删除确认', {
      confirmButtonText: '残忍删除',
      cancelButtonText: '手滑了',
      type: 'warning',
    })

    // 根据后端打上的标签，决定请求哪个接口
    let url = '';
    if (post.item_type === 'post') url = `/api/posts/${post.id}`;
    else if (post.item_type === 'career') url = `/api/careers/${post.id}`;
    else if (post.item_type === 'competition') url = `/api/competitions/${post.id}`;

    const res = await request.delete(url)
    
    if (res.data.code === 200) {
      ElMessage.success('内容已彻底删除')
      // 从列表中精准剔除（因为不同表的 id 可能会重复，所以必须把 type 和 id 连起来比对才安全）
      myPosts.value = myPosts.value.filter(p => !(p.id === post.id && p.item_type === post.item_type))
    } else {
      ElMessage.error(res.data.message)
    }
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('网络请求失败')
  }
}
// 准备上传所需的请求头（保持 token 读取为实时值）
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`
}))

// 上传成功的回调
const handleAvatarSuccess = (response) => {
  if (!isPageActive.value) return
  
  if (response.code === 200) {
    settingsForm.value.avatar = response.url
    ElMessage.success('图片上传成功！别忘了保存修改哦')
  } else {
    ElMessage.error(response.message || '上传出现未知错误')
  }
}
// 👉 新增：增加失败回调，抓住被隐藏的错误！
const handleAvatarError = (error) => {
  console.error('头像上传失败:', error)
  ElMessage.error('网络请求失败，请打开 F12 查看控制台')
}
// 上传前的校验
const beforeAvatarUpload = (rawFile) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(rawFile.type)) {
    ElMessage.error('头像图片必须是 JPG/PNG/GIF 格式!');
    return false;
  } else if (rawFile.size / 1024 / 1024 > 2) {
    ElMessage.error('图片大小不能超过 2MB!');
    return false;
  }
  return true;
};
// 👉 [新增] 高危操作：注销账号
const handleDeleteAccount = async () => {
  try {
    // 弹出带有输入框的确认提示
    await ElMessageBox.prompt(
      '账号注销后，您的所有帖子、评论和收藏都将被永久删除！<br/>如果您确认注销，请在下方输入您的学号：<b>' + userInfo.value.username + '</b>',
      '⚠️ 危险操作确认',
      {
        confirmButtonText: '确认永久注销',
        cancelButtonText: '取消',
        dangerouslyUseHTMLString: true, // 允许提示语中使用加粗等 HTML 标签
        inputPattern: new RegExp(`^${userInfo.value.username}$`), // 👉 动态正则：必须一字不差地输入当前账号！
        inputErrorMessage: '输入的账号不匹配，无法执行注销',
        type: 'error'
      }
    )

    // 如果用户真的输入正确并点击了确认，就会走到这里发请求
    const res = await request.delete('/api/user/account')
    
    if (res.data.code === 200) {
      ElMessage.success('账号已永久注销，期待与您的再次相遇。')
      localStorage.removeItem('token') // 清除登录凭证
      router.push('/login')            // 踢回登录页
    }
  } catch (error) {
    // error 为 'cancel' 表示用户点了取消，不用管它
    if (error !== 'cancel') {
      ElMessage.error('注销失败，请稍后再试')
    }
  }
}

onMounted(() => {
  fetchUserInfo()
  fetchMyPosts()
  fetchMyFavorites()
  fetchUserStats()
  
  // 👉 [新增] 检查是不是从导航栏的“我的收藏”点进来的
  if (route.query.tab === 'favorites') {
    activeTab.value = 'favorites' // 直接激活收藏标签页！
  }
})

onUnmounted(() => {
  isPageActive.value = false
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
/* 修改头像上传框的样式，解决点击不跟手的问题 */
.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  width: 100px;
  height: 100px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  
  /* 👉 [修复1] 强制提升层级，确保不被周围其他隐形元素遮挡 */
  position: relative;
  z-index: 10;
  
  /* 👉 [修复2] 确保背景和边框的变化瞬间完成，不阻塞点击事件 */
  transition: border-color 0.1s ease; 
}

.avatar-uploader:hover { 
  border-color: #409eff; 
}

/* 👉 [修复3] 关键：防止内部元素(特别是图片)干扰点击事件 */
/* 让鼠标点击完全穿透图片，直接点在最外层的 uploader 上 */
:deep(.avatar-uploader .el-upload) {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar-preview { 
  width: 100px; 
  height: 100px; 
  object-fit: cover; 
  /* 让图片像个幽灵一样，鼠标能穿透它点到后面的上传框 */
  pointer-events: none; 
}

.avatar-uploader-icon { 
  font-size: 28px; 
  color: #8c939d; 
  /* 同样，让加号图标也不要挡着点击事件 */
  pointer-events: none;
}

@media (max-width: 768px) {
  .main-content {
    padding: 14px 12px;
  }

  .profile-card,
  .content-card {
    margin-bottom: 12px;
  }

  .content-card {
    min-height: auto;
  }

  .profile-tabs {
    padding: 0;
  }

  .settings-form {
    max-width: 100%;
    padding: 12px 0;
  }

  .post-content {
    white-space: normal;
  }

  :deep(.el-radio-group) {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
  }
}

</style>