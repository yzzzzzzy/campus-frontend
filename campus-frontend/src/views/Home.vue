<template>
  <div class="common-layout">
    <el-container>
      <NavBar title="🎓 校园信息共享平台" bgColor="#409EFF" />

      <el-main class="main-content">
        <div class="hero-banner">
          <div class="banner-content">
            <h1 class="banner-title">打破信息壁垒，规划理想未来</h1>
            <p class="banner-subtitle">专注于大学生的升学、竞赛、就业与高质量互助</p>
            <div class="hero-actions">
              <el-button type="primary" size="large" class="explore-btn" @click="router.push('/forum')" round>
                立即探索社区
              </el-button>
              <el-button
                v-if="isAdmin"
                type="warning"
                size="large"
                class="admin-entry-btn"
                @click="router.push('/admin')"
                round
              >
                进入管理后台
              </el-button>
            </div>
          </div>
        </div>

        <div class="nav-grid">
          <el-row :gutter="30" justify="center">
            <el-col :md="8" :sm="12" :xs="24" class="nav-col">
              <div class="card-wrapper" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave" @click="router.push('/study')">
                <el-card class="nav-card" shadow="never">
                  <div class="icon-wrapper" style="background: rgba(64, 158, 255, 0.1); color: #409EFF;">
                    <el-icon><Reading /></el-icon>
                  </div>
                  <h3>升学考公资料</h3>
                  <p>历年真题 / 备考经验 / 院校资讯</p>
                </el-card>
              </div>
            </el-col>
            <el-col :md="8" :sm="12" :xs="24" class="nav-col">
              <div class="card-wrapper" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave" @click="router.push('/skills')">
                <el-card class="nav-card" shadow="never">
                  <div class="icon-wrapper" style="background: rgba(156, 39, 176, 0.1); color: #9C27B0;">
                    <el-icon><Monitor /></el-icon>
                  </div>
                  <h3 style="color: #9C27B0;">个人提升资源</h3>
                  <p>编程开发 / 剪辑修图 / 办公效率</p>
                </el-card>
              </div>
            </el-col>
            <el-col :md="8" :sm="12" :xs="24" class="nav-col">
              <div class="card-wrapper" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave" @click="router.push('/competition')">
                <el-card class="nav-card" shadow="never">
                  <div class="icon-wrapper" style="background: rgba(103, 194, 58, 0.1); color: #67C23A;">
                    <el-icon><Trophy /></el-icon>
                  </div>
                  <h3>竞赛组队大厅</h3>
                  <p>赛事日历 / 跨专业寻找神仙队友</p>
                </el-card>
              </div>
            </el-col>
          </el-row>

          <el-row :gutter="30" justify="center" style="margin-top: 10px;">
            <el-col :md="8" :sm="12" :xs="24" class="nav-col">
              <div class="card-wrapper" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave" @click="router.push('/career')">
                <el-card class="nav-card" shadow="never">
                  <div class="icon-wrapper" style="background: rgba(230, 162, 60, 0.1); color: #E6A23C;">
                    <el-icon><Briefcase /></el-icon>
                  </div>
                  <h3>实习与就业面经</h3>
                  <p>校招内推 / 大厂面经 / 简历辅导</p>
                </el-card>
              </div>
            </el-col>
            <el-col :md="8" :sm="12" :xs="24" class="nav-col">
              <div class="card-wrapper" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave" @click="router.push('/forum')">
                <el-card class="nav-card" shadow="never">
                  <div class="icon-wrapper" style="background: rgba(245, 108, 108, 0.1); color: #F56C6C;">
                    <el-icon><ChatDotRound /></el-icon>
                  </div>
                  <h3>校园综合论坛</h3>
                  <p>二手交易 / 失物招领 / 互助问答</p>
                </el-card>
              </div>
            </el-col>
          </el-row>
        </div>

        <div class="section-header">
          <h2>🌟 平台最新资讯</h2>
          <p class="section-subtitle">持续汇聚校园最热话题</p>
          <el-divider />
          <el-empty description="个性化信息流正在生成中..." :image-size="120" />
        </div>

      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '../components/NavBar.vue'
import { getStoredUser, parseJwtPayload } from '../utils/auth'

const router = useRouter()

const isAdmin = computed(() => {
  const user = getStoredUser()
  const tokenPayload = parseJwtPayload(localStorage.getItem('token'))
  return Number(user?.role ?? tokenPayload?.role) === 1
})

// 🎮 核心炫技：计算 3D 偏转角度
const handleMouseMove = (e) => {
  const card = e.currentTarget
  // 获取卡片在屏幕中的边界和位置
  const rect = card.getBoundingClientRect()
  
  // 计算鼠标在卡片内部的相对坐标 (0 到 1 之间)
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  // 计算中心点
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  
  // 计算旋转角度 (最大倾斜 15 度)
  // 当鼠标在右边，绕 Y 轴正向旋转；鼠标在下边，绕 X 轴负向旋转
  const rotateX = ((y - centerY) / centerY) * -15
  const rotateY = ((x - centerX) / centerX) * 15

  // 应用 CSS Transform，使用 perspective 创建 3D 镜头感
  card.style.transition = 'transform 0.1s ease-out, box-shadow 0.1s ease-out'
  card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`
  // 动态阴影：鼠标往哪边移，阴影往反方向投射
  card.style.boxShadow = `${-rotateY}px ${rotateX}px 30px rgba(0,0,0,0.1)`
}

// 鼠标离开时，平滑复原
const handleMouseLeave = (e) => {
  const card = e.currentTarget
  card.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.5s ease'
  card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`
  card.style.boxShadow = `0 10px 20px rgba(0,0,0,0.03)`
}

</script>

<style scoped>
.main-content { 
  background-color: #fafbfc; /* 更干净的背景色 */
  min-height: calc(100vh - 60px); 
  padding: 30px 10%; 
}

/* 🌈 升级版 Banner */
.hero-banner { 
  position: relative;
  
  /* 👉 [核心修复] 把波点网格和蓝色渐变像三明治一样叠在一起，用逗号隔开 */
  background: 
    radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px),
    linear-gradient(135deg, #409EFF 0%, #60a5fa 100%);
  background-size: 20px 20px, 100% 100%;
  
  border-radius: 24px; 
  padding: 60px 20px; 
  text-align: center; 
  color: white; 
  margin-bottom: 50px; 
  box-shadow: 0 20px 40px rgba(64, 158, 255, 0.2); 
  overflow: hidden;
}

.banner-content {
  position: relative;
  z-index: 2;
}

.banner-title { 
  font-size: 38px; 
  margin: 0 0 15px 0; 
  font-weight: 800; 
  letter-spacing: 3px; 
  text-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.banner-subtitle { 
  font-size: 18px; 
  margin: 0 0 25px 0; 
  opacity: 0.9; 
  font-weight: 300;
}

.explore-btn {
  font-size: 16px;
  font-weight: bold;
  padding: 12px 30px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
  transition: all 0.3s;
}

.hero-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.admin-entry-btn {
  font-size: 16px;
  font-weight: bold;
  padding: 12px 24px;
  box-shadow: 0 8px 20px rgba(230, 162, 60, 0.25);
}

.explore-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(0,0,0,0.2);
}

.admin-entry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(230, 162, 60, 0.35);
}

/* 🚀 3D 卡片外层容器 */
.card-wrapper {
  cursor: pointer;
  perspective: 1000px; /* 开启 3D 舞台 */
  transform-style: preserve-3d;
  margin-bottom: 20px;
  border-radius: 20px;
  /* 初始阴影 */
  box-shadow: 0 10px 20px rgba(0,0,0,0.03); 
}

.nav-card { 
  text-align: center; 
  height: 100%; 
  border: none; 
  border-radius: 20px;
  padding: 20px 10px;
  background: white;
  pointer-events: none; /* 让鼠标事件直接穿透到外层的 wrapper 上，防止抖动 */
}

/* 图标包裹器，增加呼吸感 */
.icon-wrapper {
  width: 70px;
  height: 70px;
  margin: 0 auto 20px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 32px;
  transition: all 0.3s;
}

.card-wrapper:hover .icon-wrapper {
  transform: scale(1.1); /* 鼠标移入时，不仅卡片动，内部图标也微微放大 */
}

.nav-card h3 { 
  margin: 0 0 10px 0; 
  font-size: 20px; 
  color: #1e293b; 
  font-weight: 700;
}

.nav-card p { 
  font-size: 13px; 
  color: #64748b; 
  margin: 0; 
  line-height: 1.5;
}

.section-header { 
  margin-top: 50px;
  text-align: center; 
}

.section-header h2 { 
  margin: 0; 
  font-size: 24px; 
  color: #1e293b; 
  font-weight: bold;
}

.section-subtitle {
  color: #94a3b8;
  font-size: 14px;
  margin-top: 8px;
}

@media (max-width: 768px) {
  .main-content {
    padding: 14px 12px;
  }

  .hero-banner {
    border-radius: 16px;
    padding: 34px 14px;
    margin-bottom: 24px;
  }

  .banner-title {
    font-size: 26px;
    letter-spacing: 1px;
  }

  .banner-subtitle {
    font-size: 15px;
    margin-bottom: 18px;
  }

  .explore-btn,
  .admin-entry-btn {
    width: 100%;
    max-width: 280px;
  }

  .section-header {
    margin-top: 24px;
  }

  .section-header h2 {
    font-size: 20px;
  }

  .nav-card h3 {
    font-size: 18px;
  }
}
</style>