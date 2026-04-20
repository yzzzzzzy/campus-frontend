<template>
  <div class="login-container">
    <el-card class="login-card" shadow="hover">
      <h2 class="title">🎓 校园信息共享平台</h2>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="登录账号" name="login">
          <el-form :model="loginForm" label-position="top">
            <el-form-item label="学号/账号">
              <el-input v-model="loginForm.username" placeholder="请输入学号" prefix-icon="User" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock" show-password />
            </el-form-item>
            <el-button type="primary" class="submit-btn" @click="handleLogin">登 录</el-button>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="注册新账号" name="register">
          <el-form :model="registerForm" label-position="top">
            <el-form-item label="学号/账号">
              <el-input v-model="registerForm.username" placeholder="请输入学号" prefix-icon="User" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="registerForm.password" type="password" placeholder="设置密码" prefix-icon="Lock" show-password />
            </el-form-item>
            <el-form-item label="昵称">
              <el-input v-model="registerForm.nickname" placeholder="给自己起个好听的昵称" prefix-icon="Edit" />
            </el-form-item>
            <el-button type="success" class="submit-btn" @click="handleRegister">注 册</el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import request from '../utils/request' // 引入我们刚才写的网络工具
import { ElMessage } from 'element-plus' // 引入好看的弹窗提示
// 👉 1. 引入路由工具
import { useRouter } from 'vue-router'

const activeTab = ref('login')
// 👉 2. 实例化路由
const router = useRouter()

const loginForm = ref({
  username: '',
  password: ''
})

const registerForm = ref({
  username: '',
  password: '',
  nickname: ''
})

// 🚀 真正的登录逻辑
const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    return ElMessage.warning('账号和密码不能为空哦！')
  }
  
  try {
    // 向后端发送 POST 请求
    const res = await request.post('/api/login', loginForm.value)
    
    // 如果后端返回 200，说明成功
    if (res.data.code === 200) {
      ElMessage.success('登录成功！欢迎回来~')
      // 【核心考点】把拿到的 JWT 通行证偷偷存在浏览器的本地仓库里！
      localStorage.setItem('token', res.data.data.token)
      
      // 👉 3. 登录成功后，跳转到主页！
      router.push('/home')
      
    } else {
      // 密码错误或账号不存在
      ElMessage.error(res.data.message)
    }
  } catch (error) {
    ElMessage.error('服务器走神了')
  }
}

// 🚀 真正的注册逻辑
const handleRegister = async () => {
  if (!registerForm.value.username || !registerForm.value.password) {
    return ElMessage.warning('账号和密码不能为空！')
  }
  
  try {
    const res = await request.post('/api/register', registerForm.value)
    
    if (res.data.code === 200) {
      ElMessage.success('注册成功！快去登录吧！')
      // 注册成功后，自动帮你把标签页切回到“登录”
      activeTab.value = 'login' 
    } else {
      ElMessage.error(res.data.message)
    }
  } catch (error) {
    ElMessage.error('网络请求失败')
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-image: linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%); /* 漂亮的渐变背景 */
}

.login-card {
  width: 400px;
  border-radius: 12px;
}

.title {
  text-align: center;
  color: #303133;
  margin-bottom: 20px;
}

.submit-btn {
  width: 100%;
  margin-top: 10px;
}
</style>