export const parseJwtPayload = (token) => {
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

export const getStoredUser = () => {
    try {
        const raw = localStorage.getItem('user')
        return raw ? JSON.parse(raw) : null
    } catch (error) {
        return null
    }
}
