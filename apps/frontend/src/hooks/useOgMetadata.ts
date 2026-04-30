import { useQuery } from "@tanstack/react-query"

export type OgMetadata = {
  title?: string
  description?: string
  image?: string
  siteName?: string
}

export const useOgMetadata = (url?: string) =>
  useQuery<OgMetadata>({
    queryKey: ["og-metadata", url],
    queryFn: async () => {
      const res = await fetch(`/api/og?url=${encodeURIComponent(url!)}`)
      if (!res.ok) throw new Error("Failed to fetch OG metadata")
      return res.json()
    },
    enabled: !!url,
    staleTime: Infinity,
  })
