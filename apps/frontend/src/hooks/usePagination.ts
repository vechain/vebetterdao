// hooks/usePagination.ts
import { useState, useEffect, useCallback } from "react"
/**
 * Hook to paginate items with infinite scroll support
 * @param items - The items to paginate
 * @param itemsPerPage - The number of items per page
 * @returns An object containing the current items, whether there are more items to load, a function to load more items, and the loading state
 */
export function usePagination<T>(items: T[], itemsPerPage: number) {
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const maxPage = Math.ceil(items.length / itemsPerPage)
  const currentItems = items.slice(0, currentPage * itemsPerPage)
  const hasMore = currentPage < maxPage
  const loadMore = () => {
    if (hasMore && !loading) {
      setLoading(true)
      setTimeout(() => {
        setCurrentPage(prevPage => prevPage + 1)
        setLoading(false)
      }, 200)
    }
  }
  useEffect(() => {
    // Reset pagination only if the total number of items decreases
    if (items.length < (currentPage - 1) * itemsPerPage + 1) {
      setCurrentPage(1)
    }
  }, [items.length, currentPage, itemsPerPage])
  const reset = useCallback(() => setCurrentPage(1), [])
  return { currentItems, hasMore, loadMore, loading, reset }
}
