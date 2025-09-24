import { Metadata } from "next"
import { pagesMetadata } from "@/metadata/pages"

export function getPageMetadata(pageKey: string): Metadata {
  const pageData = pagesMetadata[pageKey as keyof typeof pagesMetadata]

  if (!pageData) {
    return {
      applicationName: "VeBetter",
      title: "VeBetter",
      description: "VeBetter - Governance platform for sustainability and Web3 impact",
    }
  }

  return {
    applicationName: "VeBetter",
    title: pageData.title,
    description: pageData.description,
    openGraph: {
      title: pageData.title,
      description: pageData.description,
      type: "website",
    },
    twitter: {
      title: pageData.title,
      description: pageData.description,
      card: "summary_large_image",
    },
  }
}
