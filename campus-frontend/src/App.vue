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
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AiChat from './components/AiChat.vue'

const route = useRoute()
const hasToken = ref(!!localStorage.getItem('token'))

// 每次路由变化时重新检查登录状态
watch(() => route.path, () => {
  hasToken.value = !!localStorage.getItem('token')
})

const showAiChat = computed(() => {
  return hasToken.value && route.path !== '/login'
})
</script>