import { ref } from 'vue'

export function usePagination(fetchFn) {
    const currentPage = ref(1)
    const pageSize = ref(10)
    const totalItems = ref(0)

    const handleFilterChange = () => {
        currentPage.value = 1
        fetchFn()
    }

    const handleSizeChange = (val) => {
        pageSize.value = val
        currentPage.value = 1
        fetchFn()
    }

    const handleCurrentChange = (val) => {
        currentPage.value = val
        fetchFn()
    }

    return { currentPage, pageSize, totalItems, handleFilterChange, handleSizeChange, handleCurrentChange }
}
