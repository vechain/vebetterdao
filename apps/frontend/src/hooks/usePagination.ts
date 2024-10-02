import { useState } from "react"

/**
 * Hook to paginate items
 * @param items - The items to paginate
 * @param itemsPerPage - The number of items per page
 * @returns An object containing the current items, whether there are more items to load, and a function to load more items
 */
function usePagination<T>(items: T[], itemsPerPage: number) {
  const [currentPage, setCurrentPage] = useState(1)
  const maxPage = Math.ceil(items.length / itemsPerPage)

  const currentItems = items.slice(0, currentPage * itemsPerPage)
  const hasMore = currentPage < maxPage

  const loadMore = () => {
    if (hasMore) setCurrentPage(prevPage => prevPage + 1)
  }

  return { currentItems, hasMore, loadMore }
}

export default usePagination
