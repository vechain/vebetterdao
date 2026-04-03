import { useQuery } from "@tanstack/react-query"

import { convertUriToUrl } from "@/utils/uri"

export type NavigatorMetadata = {
  motivation: string
  qualifications: string
  votingStrategy?: string
  disclosures: {
    isAppAffiliated: boolean
    affiliatedAppNames: string
    isFoundationMember: boolean
    foundationRole: string
    hasConflictsOfInterest: boolean
    conflictsDescription: string
  }
  socials: {
    twitter: string
    discord: string
    website: string
    other: string
  }
  registeredAt: string
  address: string
}

const fetchNavigatorMetadata = async (metadataURI: string): Promise<NavigatorMetadata> => {
  const url = convertUriToUrl(metadataURI)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Metadata fetch error: ${res.status}`)
  return res.json()
}

export const useNavigatorMetadata = (metadataURI?: string | null) =>
  useQuery({
    queryKey: ["navigator", "metadata", metadataURI],
    queryFn: () => fetchNavigatorMetadata(metadataURI!),
    enabled: !!metadataURI,
    staleTime: Infinity,
  })
