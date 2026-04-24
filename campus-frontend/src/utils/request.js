import axios from 'axios'
import { ElMessage } from 'element-plus'

const normalizeBaseUrl = (url) => (url || '').replace(/\/+$/, '')
export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000')

const request = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000
})

let isRedirectingToLogin = false
let isShowingGlobalError = false

const STATUS_MESSAGES = {
    401: '登录状态已失效，请重新登录',
    403: '无权限访问该资源',
    500: '服务器开小差了，请稍后重试'
}

const showGlobalError = (message) => {
    if (isShowingGlobalError) return
    isShowingGlobalError = true
    ElMessage.error(message)
    setTimeout(() => {
        isShowingGlobalError = false
    }, 1200)
}

const forceLogoutToLogin = (message) => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    if (!isRedirectingToLogin) {
        isRedirectingToLogin = true
        ElMessage.error(message || '登录状态已失效，请重新登录')

        if (window.location.pathname !== '/login') {
            window.location.href = '/login'
        }

        setTimeout(() => {
            isRedirectingToLogin = false
        }, 800)
    }
}

// 👉 [新增] 请求拦截器：发请求之前，先拦截下来做点事
request.interceptors.request.use(
    config => {
        // 去本地仓库找找看有没有 Token
        const token = localStorage.getItem('token')
        if (token) {
            // 如果有，就把它塞进请求头里，格式是 "Bearer <token>"
            config.headers['Authorization'] = `Bearer ${token}`
        }
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// 统一响应拦截：Token 过期/无效时，提示并退出登录
request.interceptors.response.use(
    response => response,
    error => {
        const status = error?.response?.status
        const code = error?.response?.data?.code
        const message = error?.response?.data?.message

        if (status === 401 || code === 401) {
            forceLogoutToLogin(message || STATUS_MESSAGES[status] || STATUS_MESSAGES[code])
            return Promise.reject(error)
        }

        if (status === 403 || code === 403) {
            showGlobalError(message || STATUS_MESSAGES[403])
            return Promise.reject(error)
        }

        if (status === 500 || code === 500) {
            showGlobalError(message || STATUS_MESSAGES[500])
            return Promise.reject(error)
        }

        if (!error?.response) {
            showGlobalError('网络连接异常，请检查网络后重试')
        }

        return Promise.reject(error)
    }
)

export default request