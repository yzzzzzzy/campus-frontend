import { ref } from 'vue'
import request from '../request'

export function useFavorites(favoriteType) {
    const myFavoriteIds = ref([])

    const syncFavoriteIds = (targetId, shouldInclude) => {
        const ids = new Set(myFavoriteIds.value)
        shouldInclude ? ids.add(targetId) : ids.delete(targetId)
        myFavoriteIds.value = Array.from(ids)
    }

    const fetchMyFavorites = async () => {
        try {
            const res = await request.get('/api/user/favorites', { params: { type: favoriteType } })
            if (res.data.code === 200) {
                myFavoriteIds.value = res.data.data.map(item => item.id)
            }
        } catch { /* 静默 */ }
    }

    const handleFavorite = async (item) => {
        const res = await request.post('/api/favorites/toggle', {
            target_id: item.id,
            target_type: favoriteType
        })
        if (res.data.code === 200) {
            item.is_favorited = !item.is_favorited
            syncFavoriteIds(item.id, item.is_favorited)
        }
    }

    return { myFavoriteIds, fetchMyFavorites, handleFavorite }
}
