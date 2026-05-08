<template>
  <!-- keep-alive 缓存页面实例，避免每次路由切换销毁重建，同时让 onActivated 钩子生效 -->
  <router-view v-slot="{ Component }">
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </router-view>
  <!-- 全站 AI 助手（仅登录后且在非登录页显示） -->
  <AiChat v-if="showAiChat" />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import AiChat from './components/AiChat.vue'

const route = useRoute()
const auth = useAuthStore()

const showAiChat = computed(() => {
  return auth.isLoggedIn && route.path !== '/login'
})
</script>