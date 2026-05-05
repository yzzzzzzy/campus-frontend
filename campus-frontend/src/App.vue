<template>
  <!-- keep-alive 缓存页面实例，避免每次路由切换销毁重建，同时让 onActivated 钩子生效 -->
  <router-view v-slot="{ Component }">
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

<script setup>
import LoginBox from './components/LoginBox.vue'
</script>