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
    { path: '/home', component: Home, meta: { requiresAuth: true } },
    { path: '/profile', component: Profile, meta: { requiresAuth: true } }, // 👉 新增路由规则
    { path: '/skills', component: Skills, meta: { requiresAuth: true } }, // 👉 新增路由规则
    { path: '/study', component: Study, meta: { requiresAuth: true } }, // 👉 新增路由规则
    { path: '/competition', component: Competition, meta: { requiresAuth: true } }, // 👉 新增路由规则
    { path: '/career', component: Career, meta: { requiresAuth: true } }, // 👉 新增路由规则
    { path: '/forum', component: Forum, meta: { requiresAuth: true } }, // 👉 新增路由规则
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 路由守卫：未登录不可访问受保护页面
router.beforeEach((to) => {
    const token = localStorage.getItem('token')
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

    if (requiresAuth && !token) {
        return { path: '/login', query: { redirect: to.fullPath } }
    }

    // 已登录用户访问登录页时，直接回首页
    if (to.path === '/login' && token) {
        return '/home'
    }

    return true
})

export default router