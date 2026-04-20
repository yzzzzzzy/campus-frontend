<template>
  <div class="common-layout">
    <el-container>
      <NavBar title="🎓 校园信息共享平台" bgColor="#409EFF" />

      <el-main class="main-content">
        <div class="hero-banner">
          <h1 class="banner-title">打破信息壁垒，规划理想未来</h1>
          <p class="banner-subtitle">专注于大学生的升学、竞赛、就业与高质量互助</p>
        </div>

        <div class="nav-grid">
          <el-row :gutter="20" justify="center">
            <el-col :md="8" :sm="12" :xs="24" class="nav-col">
              <el-card class="nav-card" shadow="hover" @click="router.push('/study')">
                <el-icon class="nav-icon" color="#409EFF"><Reading /></el-icon>
                <h3>升学考公资料库</h3>
                <p>历年真题 / 备考经验 / 院校资讯</p>
              </el-card>
            </el-col>
            <el-col :md="8" :sm="12" :xs="24" class="nav-col">
              <el-card class="nav-card" shadow="hover" @click="router.push('/skills')">
                <el-icon class="nav-icon" color="#9C27B0"><Monitor /></el-icon>
                <h3 style="color: #9C27B0;">个人提升资料</h3>
                <p>编程开发 / 剪辑修图 / 办公效率</p>
              </el-card>
            </el-col>
            <el-col :md="8" :sm="12" :xs="24" class="nav-col">
              <el-card class="nav-card" shadow="hover" @click="router.push('/competition')">
                <el-icon class="nav-icon" color="#67C23A"><Trophy /></el-icon>
                <h3>竞赛组队大厅</h3>
                <p>赛事日历 / 跨专业寻找神仙队友</p>
              </el-card>
            </el-col>
          </el-row>

          <el-row :gutter="20" justify="center" style="margin-top: 20px;">
            <el-col :md="8" :sm="12" :xs="24" class="nav-col">
              <el-card class="nav-card" shadow="hover" @click="router.push('/career')">
                <el-icon class="nav-icon" color="#E6A23C"><Briefcase /></el-icon>
                <h3>实习与就业面经</h3>
                <p>校招内推 / 大厂面经 / 简历辅导</p>
              </el-card>
            </el-col>
            <el-col :md="8" :sm="12" :xs="24" class="nav-col">
              <el-card class="nav-card" shadow="hover" @click="router.push('/forum')">
                <el-icon class="nav-icon" color="#F56C6C"><ChatDotRound /></el-icon>
                <h3>校园综合论坛</h3>
                <p>二手交易 / 失物招领 / 互助问答</p>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <div class="section-header">
          <h2>🌟 平台最新资讯 (持续更新中...)</h2>
          <el-divider />
          <el-empty description="未来这里将展示为您推荐的个性化信息流" />
        </div>

      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import NavBar from '../components/NavBar.vue'

const router = useRouter()


</script>

<style scoped>
/* 保持主页原有的样式 */
.header { background-color: #409EFF; color: white; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1); }
.main-content { background-color: #f5f7fa; min-height: calc(100vh - 60px); padding: 20px 10%; }
.hero-banner { background: linear-gradient(135deg, #409EFF 0%, #8CC5FF 100%); border-radius: 12px; padding: 40px 20px; text-align: center; color: white; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(64, 158, 255, 0.3); }
.banner-title { font-size: 32px; margin: 0 0 10px 0; font-weight: 600; letter-spacing: 2px; }
.banner-subtitle { font-size: 16px; margin: 0; opacity: 0.9; }
.nav-grid { margin-bottom: 40px; }
.nav-col { margin-bottom: 20px; }
.nav-card { text-align: center; cursor: pointer; transition: all 0.3s ease; height: 100%; border: none; }
.nav-card:hover { transform: translateY(-5px); }
.nav-icon { font-size: 40px; margin-top: 10px; }
.nav-card h3 { margin: 15px 0 5px 0; font-size: 18px; color: #303133; }
.nav-card p { font-size: 12px; color: #909399; margin: 0; }
.section-header { margin-bottom: 20px; text-align: center; }
.section-header h2 { margin: 0; font-size: 20px; color: #303133; }
</style>