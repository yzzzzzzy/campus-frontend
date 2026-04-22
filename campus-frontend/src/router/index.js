import { createRouter, createWebHistory } from 'vue-router'
import LoginBox from '../components/LoginBox.vue'
import Home from '../views/Home.vue'
import Profile from '../views/Profile.vue' // 👉 新增引入
import Skills from '../views/Skills.vue' // 👉 新增引入
import Study from '../views/Study.vue' // 👉 新增引入
import Competition from '../views/Competition.vue' // 👉 新增引入
import Career from '../views/Career.vue' // 👉 新增引入
import Forum from '../views/Forum.vue' // 👉 新增引入
import Admin from '../views/Admin.vue'
import { ElMessage } from 'element-plus'

const parseJwtPayload = (token) => {
    if (!token) return null
    try {
        const payload = token.split('.')[1]
        if (!payload) return null
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
        const json = decodeURIComponent(
            atob(normalized)
                .split('')
                .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
                .join('')
        )
        return JSON.parse(json)
    } catch (error) {
        return null
    }
}

const getStoredUser = () => {
    try {
        const raw = localStorage.getItem('user')
        return raw ? JSON.parse(raw) : null
    } catch (error) {
        return null
    }
}

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
    { path: '/admin', component: Admin, meta: { requiresAuth: true, requiresAdmin: true } },
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 路由守卫：未登录不可访问受保护页面
router.beforeEach((to) => {
    const token = localStorage.getItem('token')
    const storedUser = getStoredUser()
    const tokenPayload = parseJwtPayload(token)
    const effectiveRole = Number(storedUser?.role ?? tokenPayload?.role)

    // 本地 user 丢失时，用 token 里的最小字段兜底，避免管理员被误拦截
    if (!storedUser && tokenPayload?.id) {
        localStorage.setItem('user', JSON.stringify({
            id: tokenPayload.id,
            username: tokenPayload.username,
            role: tokenPayload.role
        }))
    }

    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)

    if (requiresAuth && !token) {
        return { path: '/login', query: { redirect: to.fullPath } }
    }

    if (requiresAdmin && effectiveRole !== 1) {
        ElMessage.error('无权限访问管理员后台')
        return '/home'
    }

    // 已登录用户访问登录页时，直接回首页
    if (to.path === '/login' && token) {
        return effectiveRole === 1 ? '/admin' : '/home'
    }

    return true
})

export default router