<template>
  <el-header class="header" :style="{ backgroundColor: bgColor }">
    <h2 class="logo-title" @click="router.push('/home')">{{ title }}</h2>
    
    <div class="header-right">
      <slot></slot>

      <el-dropdown v-if="showDropdown" trigger="hover" @command="handleCommand" class="avatar-dropdown">
        <div class="avatar-wrapper" @click="router.push('/profile')">
          <el-avatar :size="40" :src="userInfo.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
        </div>
        
        <template #dropdown>
          <el-dropdown-menu class="custom-dropdown">
            <div class="dropdown-header">
              <span class="user-name">{{ userInfo.nickname || userInfo.username }}</span>
              <el-tag size="small" type="success" effect="dark" class="role-tag">正式会员</el-tag>
            </div>
            <el-dropdown-item command="profile" icon="User">个人中心</el-dropdown-item>
            <el-dropdown-item command="favorites" icon="Star">我的收藏</el-dropdown-item>
            <el-dropdown-item divided command="logout" icon="SwitchButton" style="color: #F56C6C;">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </el-header>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 定义组件接收的参数 (标题和背景色)
defineProps({
  title: { type: String, default: '🎓 校园信息共享平台' },
  bgColor: { type: String, default: '#409EFF' },
  showDropdown: { type: Boolean, default: true }, // 👉 [新增] 默认显示下拉菜单
})

const userInfo = ref({})

// 获取当前登录用户的信息来渲染头像和昵称
const fetchUserInfo = async () => {
  try {
    const res = await request.get('/api/user/info')
    if (res.data.code === 200) {
      userInfo.value = res.data.data
    }
  } catch (error) {
    console.error('获取用户信息失败')
  }
}

// 处理下拉菜单的点击事件
const handleCommand = (command) => {
  if (command === 'logout') {
    localStorage.removeItem('token')
    ElMessage.success('已安全退出')
    router.push('/login')
  } else if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'favorites') {
    // 👉 [修改] 去掉原来的 ElMessage，改成带参数跳转！
    // 告诉个人中心：我要去 profile 页面，并且我要直接看 favorites 标签页
    router.push({ path: '/profile', query: { tab: 'favorites' } })
  }
}

onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.header {
  width: 100%; /* 强制撑满屏幕宽度 */
  height: 60px; /* 固定高度 */
  box-sizing: border-box; /* 确保 padding 不会撑破全宽 */
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 0 20px;
  z-index: 100; /* 保证导航栏的阴影永远压在页面内容的最上面 */
}
.logo-title {
  margin: 0;
  cursor: pointer;
  transition: opacity 0.3s;
}
.logo-title:hover {
  opacity: 0.8;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}
.avatar-dropdown {
  cursor: pointer;
  outline: none; /* 去除点击时的黑框 */
}
.avatar-wrapper {
  border: 2px solid rgba(255, 255, 255, 0.5); /* 给头像加一圈半透明的边框，更像B站 */
  border-radius: 50%;
  transition: transform 0.3s;
}
.avatar-wrapper:hover {
  transform: scale(1.1); /* 鼠标放上去头像微微放大 */
}
.custom-dropdown {
  width: 200px;
}
.dropdown-header {
  padding: 15px;
  text-align: center;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}
.user-name {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}
</style>