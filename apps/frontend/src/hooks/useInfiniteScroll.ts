import { useEffect, useCallback } from "react"

type UseInfiniteScrollProps = {
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
}
/**
 * Hook to trigger a callback when the sentinel element is intersecting
 * @returns {object} An object containing the current items, whether there are more items to load, a function to load more items, and the loading state
 */
export const useInfiniteScroll = ({ loading, hasMore, onLoadMore }: UseInfiniteScrollProps) => {
  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0]
      if (target?.isIntersecting && hasMore && !loading) {
        onLoadMore()
      }
    },
    [hasMore, loading, onLoadMore],
  )
  useEffect(() => {
    const sentinel = document.getElementById("infinite-scroll-sentinel")
    if (!sentinel) return
    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: "0px",
      threshold: 1.0,
    })
    observer.observe(sentinel)
    return () => {
      observer.unobserve(sentinel)
    }
  }, [observerCallback])
}
