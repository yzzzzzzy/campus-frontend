import { createRouter, createWebHistory } from 'vue-router'
import LoginBox from '../components/LoginBox.vue'
import Home from '../views/Home.vue'
import Profile from '../views/Profile.vue' // 👉 新增引入
import Skills from '../views/Skills.vue' // 👉 新增引入
import Study from '../views/Study.vue' // 👉 新增引入
import Competition from '../views/Competition.vue' // 👉 新增引入
import Career from '../views/Career.vue' // 👉 新增引入
import Forum from '../views/Forum.vue' // 👉 新增引入

const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginBox },
    { path: '/home', component: Home },
    { path: '/profile', component: Profile }, // 👉 新增路由规则
    { path: '/skills', component: Skills }, // 👉 新增路由规则
    { path: '/study', component: Study }, // 👉 新增路由规则
    { path: '/competition', component: Competition }, // 👉 新增路由规则
    { path: '/career', component: Career }, // 👉 新增路由规则
    { path: '/forum', component: Forum }, // 👉 新增路由规则
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router