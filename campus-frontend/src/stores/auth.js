import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
    const _t = ref(0) // trigger：变化时强制所有 computed 重新计算
    const bump = () => { _t.value++ }

    const token = computed(() => { void _t.value; return localStorage.getItem('token') || '' })
    const user = computed(() => {
        void _t.value
        try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
    })

    const isLoggedIn = computed(() => !!token.value)
    const userId = computed(() => user.value?.id || null)
    const userName = computed(() => user.value?.nickname || user.value?.username || '')
    const isAdmin = computed(() => Number(user.value?.role) === 1)

    const setAuth = (newToken, newUser) => {
        localStorage.setItem('token', newToken)
        localStorage.setItem('user', JSON.stringify(newUser))
        bump()
    }

    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        bump()
    }

    return { token, user, isLoggedIn, userId, userName, isAdmin, setAuth, logout }
})
