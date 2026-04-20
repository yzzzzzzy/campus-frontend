import axios from 'axios'

const request = axios.create({
    baseURL: 'http://localhost:3000',
    timeout: 5000
})

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

export default request