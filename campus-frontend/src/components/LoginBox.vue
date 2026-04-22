<template>
  <div class="login-page">
    <canvas ref="particleCanvas" class="particle-canvas"></canvas>

    <el-card class="login-card" shadow="never">
      <div class="login-header">
        <div class="logo-icon">
          <el-icon :size="40" color="#409EFF"><School /></el-icon>
        </div>
        <h2 class="title">CAMPUS HUB</h2>
        <p class="subtitle">校园信息共享平台</p>
      </div>
      
      <el-tabs v-model="activeTab" stretch>
        <el-tab-pane label="通行证登录" name="login">
          <el-form :model="loginForm" label-position="top">
            <el-form-item>
              <el-input v-model="loginForm.username" placeholder="学号 / 账号" prefix-icon="User" class="custom-input" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="loginForm.password" type="password" placeholder="密码" prefix-icon="Lock" show-password class="custom-input" />
            </el-form-item>
            <el-button type="primary" class="submit-btn" @click="handleLogin" :loading="loading">进入平台</el-button>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="新成员注册" name="register">
          <el-form :model="registerForm" label-position="top">
            <el-form-item>
              <el-input v-model="registerForm.username" placeholder="学号" prefix-icon="User" class="custom-input" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="registerForm.nickname" placeholder="昵称" prefix-icon="Edit" class="custom-input" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="registerForm.password" type="password" placeholder="设置密码" prefix-icon="Lock" show-password class="custom-input" />
            </el-form-item>
            <el-button type="success" class="submit-btn" @click="handleRegister">提交注册</el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <div class="footer-note">© 2026 Campus Information Sharing Platform. Built for Excellence.</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const router = useRouter()
const activeTab = ref('login')
const loading = ref(false)
const particleCanvas = ref(null)

const loginForm = ref({ username: '', password: '' })
const registerForm = ref({ username: '', password: '', nickname: '' })

// 登录/注册逻辑保持不变
const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) return ElMessage.warning('请填写完整信息')
  loading.value = true
  try {
    const res = await request.post('/api/login', loginForm.value)
    if (res.data.code === 200) {
      ElMessage.success('欢迎回来')
      localStorage.setItem('token', res.data.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.data.user))
      router.push(Number(res.data.data.user?.role) === 1 ? '/admin' : '/home')
    } else { ElMessage.error(res.data.message) }
  } catch (error) { ElMessage.error('服务器走神了') }
  finally { loading.value = false }
}

const handleRegister = async () => {
  try {
    const res = await request.post('/api/register', registerForm.value)
    if (res.data.code === 200) {
      ElMessage.success('注册成功，请登录')
      activeTab.value = 'login'
    } else { ElMessage.error(res.data.message) }
  } catch (error) { ElMessage.error('网络请求失败') }
}

// 🎨 Canvas 粒子系统逻辑 (调整为白蓝色调)
let animationFrame
let resizeHandler = null
const initParticles = () => {
  const canvas = particleCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  let particles = []

  resizeHandler = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  
  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width
      this.y = Math.random() * canvas.height
      this.vx = (Math.random() - 0.5) * 0.4
      this.vy = (Math.random() - 0.5) * 0.4
      this.radius = Math.random() * 2.5
    }
    draw() {
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      ctx.fill()
    }
    update() {
      this.x += this.vx
      this.y += this.vy
      if (this.x < 0 || this.x > canvas.width) this.vx *= -1
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1
    }
  }

  for (let i = 0; i < 80; i++) particles.push(new Particle())

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    particles.forEach(p => {
      p.update()
      p.draw()
    })
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 120) {
          ctx.beginPath()
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 - dist/800})`
          ctx.lineWidth = 0.6
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.stroke()
        }
      }
    }
    animationFrame = requestAnimationFrame(animate)
  }

  window.addEventListener('resize', resizeHandler)
  resizeHandler()
  animate()
}

onMounted(() => initParticles())
onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
    resizeHandler = null
  }
})
</script>

<style scoped>
.login-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  /* 👉 背景改为浅蓝色渐变，更有呼吸感 */
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.particle-canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.login-card {
  position: relative;
  z-index: 10;
  width: 400px;
  background: rgba(255, 255, 255, 0.6); /* 白色半透明背景 */
  backdrop-filter: blur(20px); /* 磨砂玻璃效果增强 */
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.05); /* 柔和的阴影 */
  padding: 10px;
}

.login-header {
  text-align: center;
  margin-bottom: 25px;
  margin-top: 10px;
}

.logo-icon {
  background: white;
  width: 70px;
  height: 70px;
  border-radius: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 15px;
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.1);
}

.title {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 2px;
  margin: 0;
  color: #334155;
}

.subtitle {
  font-size: 13px;
  color: #64748b;
  margin-top: 5px;
}

/* 输入框定制 */
:deep(.custom-input .el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.8) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02) !important;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  height: 45px;
}

:deep(.custom-input.is-focus .el-input__wrapper) {
  border-color: #409EFF;
}

.submit-btn {
  width: 100%;
  margin-top: 15px;
  height: 48px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
  box-shadow: 0 10px 20px rgba(64, 158, 255, 0.2);
  transition: all 0.3s;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px rgba(64, 158, 255, 0.3);
}

.footer-note {
  position: absolute;
  bottom: 30px;
  font-size: 12px;
  color: #64748b;
}

:deep(.el-tabs__nav-wrap::after) {
  background-color: transparent;
}
:deep(.el-tabs__item) {
  font-weight: 500;
  color: #94a3b8;
}
</style>